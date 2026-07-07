import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db, rtdb } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import axios from "axios";
import Message from "./Message";
import ImageViewer from "./ImageViewer";
import MoodPicker from "./MoodPicker";
import EmergencySettings from "./EmergencySettings";
import LoveLetter from "./LoveLetter";

const API_URL = import.meta.env.VITE_API_URL;

const Chat = ({ onEmergency }) => {
  const { currentUser, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [viewOnceImg, setViewOnceImg] = useState(null);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  //const [isTabFocused, setIsTabFocused] = useState(true);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [otherMood, setOtherMood] = useState("");
  const [myMood, setMyMood] = useState("");
  const [showLoveNote, setShowLoveNote] = useState(false);
  const [loveNoteText, setLoveNoteText] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState("40px");
  const [showEmergency, setShowEmergency] = useState(false);
  const [showEmergencySettings, setShowEmergencySettings] = useState(false);
  const [avatarTapCount, setAvatarTapCount] = useState(0);
  const [lastSeen, setLastSeen] = useState(null);
  // const [showLoveLetter, setShowLoveLetter] = useState(true);
  const [showLoveLetter, setShowLoveLetter] = useState(
    !localStorage.getItem("letter_shown"),
  );
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const viewOnceInputRef = useRef(null);
  const textInputRef = useRef(null);
  const isTabFocusedRef = useRef(true);
  const documentInputRef = useRef(null);
  const GIRL_EMAIL = "user2@test.com";

  // Tab focus track
  useEffect(() => {
    const handleFocus = () => {
      isTabFocusedRef.current = true;
    };
    const handleBlur = () => {
      isTabFocusedRef.current = false;
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Notification permission
  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
  }, []);

  // Dusra user fetch
  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/users`);
        const other = res.data.users.find((u) => u.uid !== currentUser.uid);
        setOtherUser(other);
      } catch (err) {
        console.error("Error fetching other user:", err);
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
      setMyMood(data?.mood || "");
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
      setOtherMood(data?.mood || "");
      setLastSeen(data?.lastSeen || null);
    });
    return () => unsub();
  }, [otherUser]);

  // Messages real-time
  useEffect(() => {
    if (!currentUser || !otherUser) return;

    const msgs = {};
    let isFirstLoad = true;

    const q1 = query(
      collection(db, "messages"),
      where("senderId", "==", currentUser.uid),
      where("receiverId", "==", otherUser.uid),
      orderBy("createdAt", "asc"),
    );

    const q2 = query(
      collection(db, "messages"),
      where("senderId", "==", otherUser.uid),
      where("receiverId", "==", currentUser.uid),
      orderBy("createdAt", "asc"),
    );

    const updateMessages = (newMsgs, fromOther = false) => {
      const sorted = Object.values(newMsgs).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );
      setMessages(sorted);

      if (!isFirstLoad && fromOther) {
        const latestMsg = sorted[sorted.length - 1];
        if (
          latestMsg &&
          latestMsg.senderId !== currentUser.uid &&
          !isTabFocusedRef.current && // ← ref use karo
          Notification.permission === "granted"
        ) {
          new Notification("MyChatApp 💬", { body: "New Message" });
        }
      }
    };

    const unsub1 = onSnapshot(q1, (snap) => {
      snap.docs.forEach((doc) => {
        msgs[doc.id] = { id: doc.id, ...doc.data() };
      });
      updateMessages(msgs, false);
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      snap.docs.forEach((doc) => {
        msgs[doc.id] = { id: doc.id, ...doc.data() };
      });
      updateMessages(msgs, true);
      isFirstLoad = false;
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [currentUser, otherUser]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    // Sirf start aur end ki space trim karo — beech wali nahi
    const trimmedText = text.replace(/^\s+|\s+$/g, "");

    if (!trimmedText && !editingMsg) return;

    try {
      if (editingMsg) {
        await axios.patch(`${API_URL}/messages/edit/${editingMsg.id}`, {
          text: trimmedText, // ← trimmedText use karo
          senderId: currentUser.uid,
        });
        setEditingMsg(null);
      } else {
        await axios.post(`${API_URL}/messages/send`, {
          senderId: currentUser.uid,
          receiverId: otherUser.uid,
          text: trimmedText, // ← trimmedText use karo
          type: "text",
          replyTo: replyTo
            ? {
                id: replyTo.id,
                text: replyTo.text,
                senderId: replyTo.senderId,
              }
            : null,
        });
        setReplyTo(null);
      }
      setText("");
      setTextareaHeight("40px");
      if (textInputRef.current) {
        textInputRef.current.style.height = "40px";
      }

      setTimeout(() => textInputRef.current?.focus(), 0);
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  // handle document upload
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setShowAttachMenu(false);
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("senderId", currentUser.uid);

      const res = await axios.post(`${API_URL}/upload/document`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await axios.post(`${API_URL}/messages/send`, {
        senderId: currentUser.uid,
        receiverId: otherUser.uid,
        text: "",
        type: "document",
        imageUrl: res.data.fileUrl,
        fileName: res.data.fileName,
        fileSize: res.data.fileSize,
        fileType: res.data.fileType,
        replyTo: null,
      });
    } catch (err) {
      console.error("Document upload error:", err);
    } finally {
      setLoading(false);
      e.target.value = "";
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
      formData.append("image", file);
      formData.append("senderId", currentUser.uid);
      const endpoint = isViewOnce ? "/upload/view-once" : "/upload/image";
      const res = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await axios.post(`${API_URL}/messages/send`, {
        senderId: currentUser.uid,
        receiverId: otherUser.uid,
        text: "",
        type: isViewOnce ? "view_once" : "image",
        imageUrl: res.data.imageUrl,
        replyTo: null,
      });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "last seen just now";
    if (mins < 60) return `last seen ${mins} min ago`;
    if (hours < 24)
      return `last seen today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (days === 1)
      return `last seen yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return `last seen ${date.toLocaleDateString([], { day: "2-digit", month: "short" })}`;
  };

  // triple tap on avtar for emergency trigger
  const handleAvatarTap = () => {
    const newCount = avatarTapCount + 1;
    setAvatarTapCount(newCount);
    if (newCount >= 3) {
      setShowEmergency(true);
      setAvatarTapCount(0);
    }
    setTimeout(() => setAvatarTapCount(0), 2000);
  };

  const handleEmergencyCall = () => {
    const number = localStorage.getItem("emergency_number") || "+919755345095";
    window.location.href = `tel:${number}`;
  };

  const handleDeleteAllChat = async () => {
    try {
      await axios.delete(`${API_URL}/messages/delete-all`, {
        data: {
          user1: currentUser.uid,
          user2: otherUser.uid,
        },
      });
      setMessages([]); // set all message to zero (clr all msg)
      setShowEmergency(false);
      await logout; // after clr all msg logout app
    } catch (err) {
      console.error("Delete all error:", err);
    }
  };

  const handleEmergencyLogout = async () => {
    if (onEmergency) {
      onEmergency(); // Fake screen activate
    }
    await logout();
  };

  // Love note send
  const sendLoveNote = async () => {
    if (!loveNoteText.trim()) return;
    try {
      await axios.post(`${API_URL}/messages/send`, {
        senderId: currentUser.uid,
        receiverId: otherUser.uid,
        text: loveNoteText,
        type: "love_note",
        replyTo: null,
      });
      setLoveNoteText("");
      setShowLoveNote(false);
    } catch (err) {
      console.error("Love note error:", err);
    }
  };

  const handleKeyPress = (e) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isMobile && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updateStatus = async (messageId, status) => {
    try {
      await axios.patch(`${API_URL}/messages/status/${messageId}`, { status });
    } catch (err) {
      console.error("Status error:", err);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
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
          <div style={styles.avatar} onClick={handleAvatarTap}>
            {otherUser?.displayName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={styles.headerName}>{otherUser?.displayName}</div>
            <div
              style={{
                ...styles.headerStatus,
                color: isOtherOnline ? "#a78bfa" : "#94a3b8",
              }}
            >
              {isOtherOnline
                ? `online${otherMood ? ` • ${otherMood}` : ""}`
                : lastSeen
                  ? formatLastSeen(lastSeen)
                  : "offline"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            style={styles.moodBtn}
            onClick={() => setShowMoodPicker(true)}
            title="Set mood"
          >
            {myMood ? (
              <span style={{ fontSize: "12px", color: "#e9edef" }}>
                {myMood.length > 10 ? myMood.slice(0, 10) + "..." : myMood}
              </span>
            ) : (
              "😶"
            )}
          </button>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
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
            onEdit={() => {
              setEditingMsg(msg);
              setText(msg.text);
            }}
            onViewOnce={() => setViewOnceImg(msg.imageUrl)}
            onSeen={() => {
              if (msg.senderId !== currentUser?.uid && msg.status !== "seen") {
                updateStatus(msg.id, "seen");
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
          <button style={styles.replyClose} onClick={() => setReplyTo(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Edit Preview */}
      {editingMsg && (
        <div style={styles.replyPreview}>
          <div style={styles.replyText}>✏️ Editing message</div>
          <button
            style={styles.replyClose}
            onClick={() => {
              setEditingMsg(null);
              setText("");
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Hidden Input Area */}
      <div style={styles.inputArea}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleImageUpload(e, false)}
        />
        <input
          ref={viewOnceInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleImageUpload(e, true)}
        />
        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
          style={{ display: "none" }}
          onChange={handleDocumentUpload}
        />

        {/* + Button with dropdown */}
        <div style={{ position: "relative" }}>
          <button
            style={styles.plusBtn}
            onClick={() => setShowAttachMenu(!showAttachMenu)}
          >
            {showAttachMenu ? "✕" : "+"}
          </button>

          {/* Dropdown menu */}
          {showAttachMenu && (
            <div style={styles.attachMenu}>
              <button
                style={styles.attachMenuItem}
                onClick={() => {
                  documentInputRef.current.click();
                }}
              >
                📄 Document
              </button>
              <button
                style={styles.attachMenuItem}
                onClick={() => {
                  fileInputRef.current.click();
                }}
              >
                📷 Photo
              </button>
              <button
                style={styles.attachMenuItem}
                onClick={() => {
                  viewOnceInputRef.current.click();
                }}
              >
                👁️ View Once
              </button>
              <button
                style={styles.attachMenuItem}
                onClick={() => {
                  setShowLoveNote(true);
                  setShowAttachMenu(false);
                }}
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
            maxHeight: "120px",
            overflowY: "auto",
            resize: "none",
            lineHeight: "1.5",
          }}
          placeholder={loading ? "Uploading..." : "Type a message..."}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            // Auto height adjust
            e.target.style.height = "40px";
            e.target.style.height = e.target.scrollHeight + "px";
            setTextareaHeight(e.target.scrollHeight + "px");
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
        <ImageViewer
          imageUrl={viewOnceImg}
          onClose={() => setViewOnceImg(null)}
        />
      )}

      {/* Mood Picker */}
      {showMoodPicker && (
        <MoodPicker onClose={() => setShowMoodPicker(false)} />
      )}

      {/* Love Note Modal */}
      {showLoveNote && (
        <div
          style={styles.loveNoteOverlay}
          onClick={() => setShowLoveNote(false)}
        >
          <div
            style={styles.loveNoteContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.loveNoteHeader}>
              <span style={styles.loveNoteTitle}>💌 Secret Love Note</span>
              <button
                style={styles.loveNoteClose}
                onClick={() => setShowLoveNote(false)}
              >
                ✕
              </button>
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

      {/* emergency modal */}
      {showEmergency && (
        <div
          style={styles.emergencyOverlay}
          onClick={() => setShowEmergency(false)}
        >
          <div
            style={styles.emergencyContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.emergencyHeader}>
              <span style={styles.emergencyTitle}>🚨 Emergency</span>
              <button
                style={styles.emergencyClose}
                onClick={() => setShowEmergency(false)}
              >
                ✕
              </button>
            </div>

            <button style={styles.emergencyBtn} onClick={handleEmergencyCall}>
              📞 Emergency Call
            </button>

            <button
              style={{
                ...styles.emergencyBtn,
                background: "#ef444420",
                color: "#ef4444",
              }}
              onClick={handleDeleteAllChat}
            >
              🗑️ Delete All Chats
            </button>

            <button
              style={{
                ...styles.emergencyBtn,
                background: "#f59e0b20",
                color: "#f59e0b",
              }}
              onClick={handleEmergencyLogout}
            >
              🔒 Hide App (Fake Screen)
            </button>

            <button
              style={{
                ...styles.emergencyBtn,
                background: "#8696a020",
                color: "#8696a0",
              }}
              onClick={() => {
                setShowEmergencySettings(true);
                setShowEmergency(false);
              }}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      )}

      {showEmergencySettings && (
        <EmergencySettings onClose={() => setShowEmergencySettings(false)} />
      )}

      {showLoveLetter && (
        <LoveLetter
          userEmail={currentUser?.email} // ← dynamic rakho
          // onClose={() => setShowLoveLetter(false)}
          onClose={() => {
            localStorage.setItem("letter_shown", "true");
            setShowLoveLetter(false);
          }}
        />
      )}
    </div>
  );
};

const styles = {
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100dvh",
    background: "#111b21",
  },
  loadingText: { color: "#8696a0", fontSize: "16px" },
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    background: "#111b21",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "linear-gradient(135deg, #0f0c29 0%, #1a1744 100%)",
    borderBottom: "1px solid rgba(99,102,241,0.2)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(10px)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff",
    boxShadow: "0 4px 15px rgba(79,70,229,0.4)",
  },

  headerName: { fontSize: "16px", fontWeight: "600", color: "#e9edef" },
  headerStatus: { fontSize: "12px", color: "#00a884" },
  moodBtn: {
    background: "transparent",
    border: "1px solid #374045",
    borderRadius: "20px",
    padding: "4px 10px",
    fontSize: "18px",
    cursor: "pointer",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #374045",
    color: "#8696a0",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 4px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    background: "linear-gradient(180deg, #0a0a1a 0%, #0d0b2a 100%)",
  },
  noMessages: {
    textAlign: "center",
    color: "#8696a0",
    fontSize: "14px",
    marginTop: "40px",
  },
  replyPreview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#202c33",
    padding: "8px 16px",
    borderLeft: "3px solid #00a884",
  },
  replyText: { fontSize: "13px", color: "#8696a0" },
  replyClose: {
    background: "transparent",
    border: "none",
    color: "#8696a0",
    cursor: "pointer",
    fontSize: "16px",
  },
  inputArea: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    padding: "10px 12px",
    paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
    background: "linear-gradient(135deg, #0f0c29 0%, #1a1744 100%)",
    borderTop: "1px solid rgba(99,102,241,0.2)",
  },

  plusBtn: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    border: "none",
    borderRadius: "50%",
    width: "42px",
    height: "42px",
    fontSize: "22px",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    flexShrink: 0,
    boxShadow: "0 4px 15px rgba(79,70,229,0.3)",
  },
  attachMenuItem: {
    display: "block",
    width: "100%",
    padding: "13px 16px",
    background: "transparent",
    border: "none",
    color: "#e9edef",
    fontSize: "14px",
    cursor: "pointer",
    textAlign: "left",
    borderBottom: "1px solid rgba(99,102,241,0.1)",
  },

  attachMenu: {
    position: "absolute",
    bottom: "55px",
    left: "0",
    background: "#1e1b4b",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    zIndex: 100,
    overflow: "hidden",
    minWidth: "160px",
  },
  textInput: {
    flex: 1,
    background: "rgba(30,27,75,0.8)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: "20px",
    padding: "10px 16px",
    color: "#f1f5f9",
    fontSize: "15px",
    outline: "none",
    resize: "none",
    lineHeight: "1.5",
    maxHeight: "120px",
    overflowY: "auto",
  },

  sendBtn: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    border: "none",
    borderRadius: "50%",
    width: "42px",
    height: "42px",
    fontSize: "18px",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 15px rgba(79,70,229,0.3)",
  },
  loveNoteOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  loveNoteContainer: {
    background: "#1a1a2e",
    border: "1px solid #ff6b9d40",
    borderRadius: "16px",
    padding: "24px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 0 40px rgba(255,107,157,0.2)",
  },
  loveNoteHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  loveNoteTitle: { color: "#ff6b9d", fontSize: "18px", fontWeight: "700" },
  loveNoteClose: {
    background: "transparent",
    border: "none",
    color: "#8696a0",
    fontSize: "18px",
    cursor: "pointer",
  },
  loveNoteSubtitle: {
    color: "#8696a0",
    fontSize: "12px",
    marginBottom: "16px",
  },
  loveNoteInput: {
    width: "100%",
    background: "#0f0f23",
    border: "1px solid #ff6b9d40",
    borderRadius: "10px",
    padding: "12px",
    color: "#e9edef",
    fontSize: "15px",
    outline: "none",
    resize: "none",
    marginBottom: "16px",
    lineHeight: "1.6",
    boxSizing: "border-box",
  },
  loveNoteSendBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #ff6b9d, #ff8e53)",
    border: "none",
    borderRadius: "10px",
    padding: "13px",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  emergencyOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(10, 10, 22, 0.75)",
    backdropFilter: "blur(12px)",
    zIndex: 300,
    display: "flex",
    alignItems: "center", // center container
    justifyContent: "center",
    padding: "20px",
  },
  emergencyContainer: {
    background: "linear-gradient(180deg, #1f1315 0%, #0f0809 100%)", // Panic Crimson subtle gradient
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "24px",
    padding: "26px",
    width: "100%",
    maxWidth: "460px",
    boxShadow: "0 -15px 40px rgba(239, 68, 68, 0.15)",
    paddingBottom: "calc(28px + env(safe-area-inset-bottom))",
  },
  emergencyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  emergencyTitle: {
    color: "#fca5a5",
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },
  emergencyClose: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "none",
    color: "#ef4444",
    fontSize: "14px",
    cursor: "pointer",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyBtn: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "15px 18px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    borderRadius: "14px",
    color: "#f8fafc",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "12px",
    textAlign: "left",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
};

export default Chat;
