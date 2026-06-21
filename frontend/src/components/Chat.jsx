import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import axios from 'axios';
import Message from './Message';
import ImageViewer from './ImageViewer';
import { rtdb } from '../firebase';
import { ref, onValue } from 'firebase/database';

const API_URL = 'http://localhost:5000/api';

const Chat = () => {
    const { currentUser, logout } = useAuth();
    const [messages, setMessages] = useState([]);
    const [otherUser, setOtherUser] = useState(null);
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [editingMsg, setEditingMsg] = useState(null);
    const [viewOnceImg, setViewOnceImg] = useState(null);
    const [isOtherOnline, setIsOtherOnline] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isTabFocused, setIsTabFocused] = useState(true);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const viewOnceInputRef = useRef(null);

    // Dusra user fetch karo automatically
    useEffect(() => {
        const fetchOtherUser = async () => {
            try {
                const res = await axios.get(`${API_URL}/auth/users`);
                const other = res.data.users.find(u => u.uid !== currentUser.uid);
                setOtherUser(other);
            } catch (err) {
                console.error('Error fetching other user:', err);
            }
        };

        if (currentUser) {
            fetchOtherUser();
        }
    }, [currentUser]);

    // Messages real-time listen karo Firestore se
    useEffect(() => {
        if (!currentUser || !otherUser) return;

        const msgs = {};
        let isFirstLoad = true;  // ← ye add karo

        const updateMessages = (newMsgs) => {
            const sorted = Object.values(newMsgs).sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
            setMessages(sorted);

            // Naya message aaya aur tab focus nahi hai
            if (!isFirstLoad) {
                const latestMsg = sorted[sorted.length - 1];
                if (
                    latestMsg &&
                    latestMsg.senderId !== currentUser.uid &&
                    !isTabFocused &&
                    Notification.permission === 'granted'
                ) {
                    new Notification('MyChatApp 💬', {
                        body: 'New Message',
                        icon: '/chat-icon.png'  // optional
                    });
                }
            }
        };

        const q1 = query(
            collection(db, 'messages'),
            where('senderId', '==', currentUser.uid),
            where('receiverId', '==', otherUser.uid),
            orderBy('createdAt', 'asc')
        );

        const q2 = query(
            collection(db, 'messages'),
            where('senderId', '==', otherUser.uid),
            where('receiverId', '==', currentUser.uid),
            orderBy('createdAt', 'asc')
        );

        const unsub1 = onSnapshot(q1, (snap) => {
            snap.docs.forEach(doc => {
                msgs[doc.id] = { id: doc.id, ...doc.data() };
            });
            updateMessages(msgs);
        });

        const unsub2 = onSnapshot(q2, (snap) => {
            snap.docs.forEach(doc => {
                msgs[doc.id] = { id: doc.id, ...doc.data() };
            });
            updateMessages(msgs);

            // First load ke baad true karo
            isFirstLoad = false;
        });

        return () => {
            unsub1();
            unsub2();
        };
    }, [currentUser, otherUser, isTabFocused]);

    // Other user ka online status track karo
    useEffect(() => {
        if (!otherUser) return;

        const statusRef = ref(rtdb, `status/${otherUser.uid}`);
        const unsub = onValue(statusRef, (snapshot) => {
            const data = snapshot.val();
            setIsOtherOnline(data?.online || false);
        });

        return () => unsub();
    }, [otherUser]);

    // Tab focus track karo
    useEffect(() => {
        const handleFocus = () => setIsTabFocused(true);
        const handleBlur = () => setIsTabFocused(false);

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    // Notification permission maango
    useEffect(() => {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }, []);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Message send karo
    const sendMessage = async () => {
        if (!text.trim() && !editingMsg) return;

        try {
            if (editingMsg) {
                await axios.patch(`${API_URL}/messages/edit/${editingMsg.id}`, {
                    text,
                    senderId: currentUser.uid
                });
                setEditingMsg(null);
            } else {
                await axios.post(`${API_URL}/messages/send`, {
                    senderId: currentUser.uid,
                    receiverId: otherUser.uid,
                    text,
                    type: 'text',
                    replyTo: replyTo ? {
                        id: replyTo.id,
                        text: replyTo.text,
                        senderId: replyTo.senderId
                    } : null
                });
                setReplyTo(null);
            }
            setText('');
        } catch (err) {
            console.error('Send error:', err);
        }
    };

    // Image upload
    const handleImageUpload = async (e, isViewOnce = false) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('senderId', currentUser.uid);

            const endpoint = isViewOnce ? '/upload/view-once' : '/upload/image';
            const res = await axios.post(`${API_URL}${endpoint}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await axios.post(`${API_URL}/messages/send`, {
                senderId: currentUser.uid,
                receiverId: otherUser.uid,
                text: '',
                type: isViewOnce ? 'view_once' : 'image',
                imageUrl: res.data.imageUrl,
                replyTo: null
            });

        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    // Enter press to send
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Status update
    const updateStatus = async (messageId, status) => {
        try {
            await axios.patch(`${API_URL}/messages/status/${messageId}`, { status });
        } catch (err) {
            console.error('Status error:', err);
        }
    };

    if (!otherUser) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loadingText}>Loading chat...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>

            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.avatar}>
                        {otherUser?.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={styles.headerName}>{otherUser?.displayName}</div>
                        <div style={{
                            ...styles.headerStatus,
                            color: isOtherOnline ? '#00a884' : '#8696a0'
                        }}>
                            {isOtherOnline ? 'online' : 'offline'}
                        </div>
                    </div>
                </div>
                <button style={styles.logoutBtn} onClick={logout}>Logout</button>
            </div>

            {/* Messages */}
            <div style={styles.messagesContainer}>
                {messages.length === 0 && (
                    <div style={styles.noMessages}>
                        No messages yet — say hello! 👋
                    </div>
                )}
                {messages.map((msg) => (
                    <Message
                        key={msg.id}
                        msg={msg}
                        isOwn={msg.senderId === currentUser?.uid}
                        currentUser={currentUser}
                        otherUser={otherUser}
                        onReply={() => setReplyTo(msg)}
                        onEdit={() => {
                            setEditingMsg(msg);
                            setText(msg.text);
                        }}
                        onViewOnce={() => setViewOnceImg(msg.imageUrl)}
                        onSeen={() => {
                            if (msg.senderId !== currentUser?.uid && msg.status !== 'seen') {
                                updateStatus(msg.id, 'seen');
                            }
                        }}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyTo && (
                <div style={styles.replyPreview}>
                    <div style={styles.replyText}>
                        ↩ Replying to: "{replyTo.text?.slice(0, 50)}"
                    </div>
                    <button style={styles.replyClose} onClick={() => setReplyTo(null)}>✕</button>
                </div>
            )}

            {/* Edit Preview */}
            {editingMsg && (
                <div style={styles.replyPreview}>
                    <div style={styles.replyText}>✏️ Editing message</div>
                    <button style={styles.replyClose} onClick={() => {
                        setEditingMsg(null);
                        setText('');
                    }}>✕</button>
                </div>
            )}

            {/* Input Area */}
            <div style={styles.inputArea}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleImageUpload(e, false)}
                />
                <input
                    ref={viewOnceInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleImageUpload(e, true)}
                />

                <button
                    style={styles.iconBtn}
                    onClick={() => fileInputRef.current.click()}
                    title="Send Photo"
                >
                    📷
                </button>

                <button
                    style={styles.iconBtn}
                    onClick={() => viewOnceInputRef.current.click()}
                    title="Send View Once"
                >
                    👁️
                </button>

                <input
                    style={styles.textInput}
                    placeholder={loading ? 'Uploading...' : 'Type a message...'}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                />

                <button
                    style={{
                        ...styles.sendBtn,
                        opacity: loading ? 0.6 : 1
                    }}
                    onClick={sendMessage}
                    disabled={loading}
                >
                    ➤
                </button>
            </div>

            {/* View Once Viewer */}
            {viewOnceImg && (
                <ImageViewer
                    imageUrl={viewOnceImg}
                    onClose={() => setViewOnceImg(null)}
                />
            )}

        </div>
    );
};

const styles = {
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#111b21'
    },
    loadingText: {
        color: '#8696a0',
        fontSize: '16px'
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#111b21'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#202c33',
        borderBottom: '1px solid #374045'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#00a884',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '700',
        color: '#fff'
    },
    headerName: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#e9edef'
    },
    headerStatus: {
        fontSize: '12px',
        color: '#00a884'
    },
    logoutBtn: {
        background: 'transparent',
        border: '1px solid #374045',
        color: '#8696a0',
        padding: '6px 14px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px'
    },
    messagesContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    noMessages: {
        textAlign: 'center',
        color: '#8696a0',
        fontSize: '14px',
        marginTop: '40px'
    },
    replyPreview: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#202c33',
        padding: '8px 16px',
        borderLeft: '3px solid #00a884'
    },
    replyText: {
        fontSize: '13px',
        color: '#8696a0'
    },
    replyClose: {
        background: 'transparent',
        border: 'none',
        color: '#8696a0',
        cursor: 'pointer',
        fontSize: '16px'
    },
    inputArea: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: '#202c33',
        borderTop: '1px solid #374045'
    },
    iconBtn: {
        background: 'transparent',
        border: 'none',
        fontSize: '22px',
        cursor: 'pointer',
        padding: '4px'
    },
    textInput: {
        flex: 1,
        background: '#2a3942',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#e9edef',
        fontSize: '15px',
        outline: 'none'
    },
    sendBtn: {
        background: '#00a884',
        border: 'none',
        borderRadius: '50%',
        width: '42px',
        height: '42px',
        fontSize: '18px',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};

export default Chat;