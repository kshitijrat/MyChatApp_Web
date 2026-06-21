import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, rtdb } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import axios from 'axios';
import Message from './Message';
import ImageViewer from './ImageViewer';
import MoodPicker from './MoodPicker';

const API_URL = import.meta.env.VITE_API_URL;

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
    const [showMoodPicker, setShowMoodPicker] = useState(false);
    const [otherMood, setOtherMood] = useState('');
    const [myMood, setMyMood] = useState('');
    const [showLoveNote, setShowLoveNote] = useState(false);
    const [loveNoteText, setLoveNoteText] = useState('');
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [textareaHeight, setTextareaHeight] = useState('40px');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const viewOnceInputRef = useRef(null);
    const textInputRef = useRef(null);

    // Tab focus track
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

    // Notification permission
    useEffect(() => {
        if ('Notification' in window) Notification.requestPermission();
    }, []);

    // Dusra user fetch
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
        if (currentUser) fetchOtherUser();
    }, [currentUser]);

    // My mood track
    useEffect(() => {
        if (!currentUser) return;
        const myStatusRef = ref(rtdb, `status/${currentUser.uid}`);
        const unsub = onValue(myStatusRef, (snapshot) => {
            const data = snapshot.val();
            setMyMood(data?.mood || '');
        });
        return () => unsub();
    }, [currentUser]);

    // Other user online + mood
    useEffect(() => {
        if (!otherUser) return;
        const statusRef = ref(rtdb, `status/${otherUser.uid}`);
        const unsub = onValue(statusRef, (snapshot) => {
            const data = snapshot.val();
            setIsOtherOnline(data?.online || false);
            setOtherMood(data?.mood || '');
        });
        return () => unsub();
    }, [otherUser]);

    // Messages real-time
    useEffect(() => {
        if (!currentUser || !otherUser) return;

        const msgs = {};
        let isFirstLoad = true;

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

        const updateMessages = (newMsgs, fromOther = false) => {
            const sorted = Object.values(newMsgs).sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
            setMessages(sorted);

            if (!isFirstLoad && fromOther) {
                const latestMsg = sorted[sorted.length - 1];
                if (
                    latestMsg &&
                    latestMsg.senderId !== currentUser.uid &&
                    !isTabFocused &&
                    Notification.permission === 'granted'
                ) {
                    new Notification('MyChatApp 💬', { body: 'New Message' });
                }
            }
        };

        const unsub1 = onSnapshot(q1, (snap) => {
            snap.docs.forEach(doc => { msgs[doc.id] = { id: doc.id, ...doc.data() }; });
            updateMessages(msgs, false);
        });

        const unsub2 = onSnapshot(q2, (snap) => {
            snap.docs.forEach(doc => { msgs[doc.id] = { id: doc.id, ...doc.data() }; });
            updateMessages(msgs, true);
            isFirstLoad = false;
        });

        return () => { unsub1(); unsub2(); };
    }, [currentUser, otherUser, isTabFocused]);

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message
    const sendMessage = async () => {
        if (!text.trim() && !editingMsg) return;
        try {
            if (editingMsg) {
                await axios.patch(`${API_URL}/messages/edit/${editingMsg.id}`, {
                    text, senderId: currentUser.uid
                });
                setEditingMsg(null);
            } else {
                await axios.post(`${API_URL}/messages/send`, {
                    senderId: currentUser.uid,
                    receiverId: otherUser.uid,
                    text, type: 'text',
                    replyTo: replyTo ? {
                        id: replyTo.id,
                        text: replyTo.text,
                        senderId: replyTo.senderId
                    } : null
                });
                setReplyTo(null);
            }
            setText('');
            setTimeout(() => textInputRef.current?.focus(), 50);
        } catch (err) {
            console.error('Send error:', err);
        }
    };

    // Image upload
    const handleImageUpload = async (e, isViewOnce = false) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        setShowAttachMenu(false);
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

    // Love note send
    const sendLoveNote = async () => {
        if (!loveNoteText.trim()) return;
        try {
            await axios.post(`${API_URL}/messages/send`, {
                senderId: currentUser.uid,
                receiverId: otherUser.uid,
                text: loveNoteText,
                type: 'love_note',
                replyTo: null
            });
            setLoveNoteText('');
            setShowLoveNote(false);
        } catch (err) {
            console.error('Love note error:', err);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const updateStatus = async (messageId, status) => {
        try {
            await axios.patch(`${API_URL}/messages/status/${messageId}`, { status });
        } catch (err) {
            console.error('Status error:', err);
        }
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error('Logout error:', err);
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
                            {otherMood ? ` • ${otherMood}` : ''}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        style={styles.moodBtn}
                        onClick={() => setShowMoodPicker(true)}
                        title="Set mood"
                    >
                        {myMood ? (
                            <span style={{ fontSize: '12px', color: '#e9edef' }}>
                                {myMood.length > 10 ? myMood.slice(0, 10) + '...' : myMood}
                            </span>
                        ) : '😶'}
                    </button>
                    <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
                </div>
            </div>

            {/* Messages */}
            <div style={styles.messagesContainer}>
                {messages.length === 0 && (
                    <div style={styles.noMessages}>No messages yet — say hello! 👋</div>
                )}
                {messages.map((msg) => (
                    <Message
                        key={msg.id}
                        msg={msg}
                        isOwn={msg.senderId === currentUser?.uid}
                        currentUser={currentUser}
                        otherUser={otherUser}
                        onReply={() => setReplyTo(msg)}
                        onEdit={() => { setEditingMsg(msg); setText(msg.text); }}
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
                    <div style={styles.replyText}>↩ Replying to: "{replyTo.text?.slice(0, 50)}"</div>
                    <button style={styles.replyClose} onClick={() => setReplyTo(null)}>✕</button>
                </div>
            )}

            {/* Edit Preview */}
            {editingMsg && (
                <div style={styles.replyPreview}>
                    <div style={styles.replyText}>✏️ Editing message</div>
                    <button style={styles.replyClose} onClick={() => { setEditingMsg(null); setText(''); }}>✕</button>
                </div>
            )}

            {/* Input Area */}
            <div style={styles.inputArea}>
                <input ref={fileInputRef} type="file" accept="image/*"
                    style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, false)} />
                <input ref={viewOnceInputRef} type="file" accept="image/*"
                    style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, true)} />

                {/* + Button with dropdown */}
                <div style={{ position: 'relative' }}>
                    <button
                        style={styles.plusBtn}
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                    >
                        {showAttachMenu ? '✕' : '+'}
                    </button>

                    {/* Dropdown menu */}
                    {showAttachMenu && (
                        <div style={styles.attachMenu}>
                            <button
                                style={styles.attachMenuItem}
                                onClick={() => { fileInputRef.current.click(); }}
                            >
                                📷 Photo
                            </button>
                            <button
                                style={styles.attachMenuItem}
                                onClick={() => { viewOnceInputRef.current.click(); }}
                            >
                                👁️ View Once
                            </button>
                            <button
                                style={styles.attachMenuItem}
                                onClick={() => { setShowLoveNote(true); setShowAttachMenu(false); }}
                            >
                                💌 Love Note
                            </button>
                        </div>
                    )}
                </div>

                <textarea
                    ref={textInputRef}
                    style={{
                        ...styles.textInput,
                        height: textareaHeight,
                        maxHeight: '120px',
                        overflowY: 'auto',
                        resize: 'none',
                        lineHeight: '1.5',
                    }}
                    placeholder={loading ? 'Uploading...' : 'Type a message...'}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        // Auto height adjust
                        e.target.style.height = '40px';
                        e.target.style.height = e.target.scrollHeight + 'px';
                        setTextareaHeight(e.target.scrollHeight + 'px');
                    }}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    rows={1}
                />

                <button
                    style={{ ...styles.sendBtn, opacity: loading ? 0.6 : 1 }}
                    onClick={sendMessage}
                    disabled={loading}
                >
                    ➤
                </button>
            </div>

            {/* View Once Viewer */}
            {viewOnceImg && (
                <ImageViewer imageUrl={viewOnceImg} onClose={() => setViewOnceImg(null)} />
            )}

            {/* Mood Picker */}
            {showMoodPicker && (
                <MoodPicker onClose={() => setShowMoodPicker(false)} />
            )}

            {/* Love Note Modal */}
            {showLoveNote && (
                <div style={styles.loveNoteOverlay} onClick={() => setShowLoveNote(false)}>
                    <div style={styles.loveNoteContainer} onClick={e => e.stopPropagation()}>
                        <div style={styles.loveNoteHeader}>
                            <span style={styles.loveNoteTitle}>💌 Secret Love Note</span>
                            <button style={styles.loveNoteClose} onClick={() => setShowLoveNote(false)}>✕</button>
                        </div>
                        <p style={styles.loveNoteSubtitle}>
                            Ye note sirf ek baar padhne ke baad disappear ho jaayega ❤️
                        </p>
                        <textarea
                            style={styles.loveNoteInput}
                            placeholder="Apne dil ki baat likho... 💕"
                            value={loveNoteText}
                            onChange={(e) => setLoveNoteText(e.target.value)}
                            rows={4}
                            autoFocus
                        />
                        <button style={styles.loveNoteSendBtn} onClick={sendLoveNote}>
                            Send Love Note 💌
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

const styles = {
    loadingContainer: {
        display: 'flex', justifyContent: 'center',
        alignItems: 'center', height: '100dvh', background: '#111b21'
    },
    loadingText: { color: '#8696a0', fontSize: '16px' },
    container: {
        display: 'flex', flexDirection: 'column',
        height: '100dvh', background: '#111b21'
    },
    header: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '10px 16px',
        background: '#202c33', borderBottom: '1px solid #374045',
        position: 'sticky', top: 0, zIndex: 100
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    avatar: {
        width: '40px', height: '40px', borderRadius: '50%',
        background: '#00a884', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#fff'
    },
    headerName: { fontSize: '16px', fontWeight: '600', color: '#e9edef' },
    headerStatus: { fontSize: '12px', color: '#00a884' },
    moodBtn: {
        background: 'transparent', border: '1px solid #374045',
        borderRadius: '20px', padding: '4px 10px',
        fontSize: '18px', cursor: 'pointer'
    },
    logoutBtn: {
        background: 'transparent', border: '1px solid #374045',
        color: '#8696a0', padding: '6px 14px', borderRadius: '6px',
        cursor: 'pointer', fontSize: '13px'
    },
    messagesContainer: {
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '4px'
    },
    noMessages: {
        textAlign: 'center', color: '#8696a0',
        fontSize: '14px', marginTop: '40px'
    },
    replyPreview: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', background: '#202c33',
        padding: '8px 16px', borderLeft: '3px solid #00a884'
    },
    replyText: { fontSize: '13px', color: '#8696a0' },
    replyClose: {
        background: 'transparent', border: 'none',
        color: '#8696a0', cursor: 'pointer', fontSize: '16px'
    },
    inputArea: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', // ← ye add karo
        background: '#202c33',
        borderTop: '1px solid #374045'
    },
    plusBtn: {
        background: '#2a3942', border: 'none', borderRadius: '50%',
        width: '38px', height: '38px', fontSize: '22px',
        color: '#00a884', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontWeight: '700', flexShrink: 0
    },
    attachMenu: {
        position: 'absolute', bottom: '50px', left: '0',
        background: '#233138', borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        zIndex: 100, overflow: 'hidden', minWidth: '150px'
    },
    attachMenuItem: {
        display: 'block', width: '100%', padding: '12px 16px',
        background: 'transparent', border: 'none',
        color: '#e9edef', fontSize: '14px',
        cursor: 'pointer', textAlign: 'left',
        borderBottom: '1px solid #374045'
    },
    textInput: {
        flex: 1, background: '#2a3942', border: 'none',
        borderRadius: '8px', padding: '10px 14px',
        color: '#e9edef', fontSize: '15px', outline: 'none'
    },
    sendBtn: {
        background: '#00a884', border: 'none', borderRadius: '50%',
        width: '42px', height: '42px', fontSize: '18px',
        color: '#fff', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0
    },
    loveNoteOverlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)', zIndex: 200,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px'
    },
    loveNoteContainer: {
        background: '#1a1a2e', border: '1px solid #ff6b9d40',
        borderRadius: '16px', padding: '24px', width: '100%',
        maxWidth: '400px', boxShadow: '0 0 40px rgba(255,107,157,0.2)'
    },
    loveNoteHeader: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '8px'
    },
    loveNoteTitle: { color: '#ff6b9d', fontSize: '18px', fontWeight: '700' },
    loveNoteClose: {
        background: 'transparent', border: 'none',
        color: '#8696a0', fontSize: '18px', cursor: 'pointer'
    },
    loveNoteSubtitle: { color: '#8696a0', fontSize: '12px', marginBottom: '16px' },
    loveNoteInput: {
        width: '100%', background: '#0f0f23', border: '1px solid #ff6b9d40',
        borderRadius: '10px', padding: '12px', color: '#e9edef',
        fontSize: '15px', outline: 'none', resize: 'none',
        marginBottom: '16px', lineHeight: '1.6', boxSizing: 'border-box'
    },
    loveNoteSendBtn: {
        width: '100%', background: 'linear-gradient(135deg, #ff6b9d, #ff8e53)',
        border: 'none', borderRadius: '10px', padding: '13px',
        color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer'
    }
};

export default Chat;