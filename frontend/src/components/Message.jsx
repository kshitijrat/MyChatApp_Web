import { useEffect, useState, useRef } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const Message = ({
  msg,
  isOwn,
  currentUser,
  otherUser,
  onReply,
  onEdit,
  onViewOnce,
  onSeen,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [viewOnceOpened, setViewOnceOpened] = useState(msg.viewed);
  const [loveNoteOpen, setLoveNoteOpen] = useState(false);
  const [countdown, setCountdown] = useState(600);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showReplyHint, setShowReplyHint] = useState(false);

  const menuRef = useRef(null);
  const longPressTimer = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const wrapperRef = useRef(null);

  // Seen update
  useEffect(() => {
    if (!isOwn && msg.status !== "seen") onSeen();
  }, [msg.id]);

  // Countdown for love note
  useEffect(() => {
    if (!loveNoteOpen) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setLoveNoteOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loveNoteOpen]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  // Long press handlers
  const handleTouchStart = (e) => {
    // const touch = e.touches[0];
    // touchStartX.current = touch.clientX;
    // touchStartY.current = touch.clientY;

    longPressTimer.current = setTimeout(() => {
      // setMenuPos({ x: touch.clientX, y: touch.clientY });
      setShowMenu(true);
      // Vibration on long press
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // Swipe to reply
  const handleSwipeTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
  };

  const handleSwipeTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Sirf horizontal swipe allow karo
    if (Math.abs(dy) > Math.abs(dx)) return;

    // Right swipe only — max 80px
    if (dx > 0 && dx < 80) {
      setSwipeX(dx);
      if (dx > 50) setShowReplyHint(true);
      else setShowReplyHint(false);
    }
  };

  const handleSwipeTouchEnd = () => {
    setIsSwiping(false);
    if (swipeX > 50) {
      onReply();
      if (navigator.vibrate) navigator.vibrate(30);
    }
    setSwipeX(0);
    setShowReplyHint(false);

    // Long press cancel
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // Desktop right click
  const handleContextMenu = (e) => {
    e.preventDefault();
    // setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  // Delete handlers
  const handleDeleteForMe = async () => {
    try {
      await axios.patch(`${API_URL}/messages/delete-for-me/${msg.id}`, {
        userId: currentUser.uid,
      });
      setShowMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteForEveryone = async () => {
    try {
      await axios.delete(`${API_URL}/messages/delete-for-everyone/${msg.id}`, {
        data: { senderId: currentUser.uid },
      });
      setShowMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  // View once
  const handleViewOnce = async () => {
    if (viewOnceOpened) return;
    setViewOnceOpened(true);
    onViewOnce(msg.imageUrl);
    try {
      await axios.patch(`${API_URL}/messages/view-once/${msg.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Love note open
  const handleOpenLoveNote = async () => {
    setLoveNoteOpen(true);
    setCountdown(600);
    try {
      await axios.patch(`${API_URL}/messages/view-once/${msg.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return "📄";
    if (fileType.includes("pdf")) return "📕";
    if (fileType.includes("word")) return "📘";
    if (fileType.includes("excel") || fileType.includes("sheet")) return "📗";
    if (fileType.includes("powerpoint")) return "📙";
    if (fileType.includes("zip")) return "🗜️";
    if (fileType.includes("text")) return "📝";
    return "📄";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderStatus = () => {
    if (!isOwn) return null;
    switch (msg.status) {
      case "sent":
        return <span style={styles.tick}>✓</span>;
      case "delivered":
        return <span style={styles.tick}>✓✓</span>;
      case "seen":
        return <span style={{ ...styles.tick, color: "#a78bfa" }}>✓✓</span>;
      default:
        return null;
    }
  };

  if (msg.deletedFor?.includes(currentUser?.uid)) return null;

  return (
    <div
      ref={wrapperRef}
      className={`message-wrapper ${isSwiping ? "swiping" : ""}`}
      style={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        marginBottom: "6px",
        padding: "0 12px",
        transform: `translateX(${swipeX}px)`,
        position: "relative",
      }}
      onTouchStart={(e) => {
        handleTouchStart(e);
        handleSwipeTouchStart(e);
      }}
      onTouchMove={handleSwipeTouchMove}
      onTouchEnd={(e) => {
        handleTouchEnd();
        handleSwipeTouchEnd();
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Reply hint icon */}
      {showReplyHint && (
        <div
          style={{
            position: "absolute",
            left: isOwn ? "auto" : "-10px",
            right: isOwn ? "-10px" : "auto",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "18px",
            opacity: swipeX / 80,
            transition: "opacity 0.1s",
          }}
        >
          ↩
        </div>
      )}

      {/* Message bubble */}
      <div
        style={{
          maxWidth: "70%",
          padding: "10px 14px",
          borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isOwn
            ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
            : "linear-gradient(135deg, #1e1b4b 0%, #1a1744 100%)",
          boxShadow: isOwn
            ? "0 4px 15px rgba(79,70,229,0.3)"
            : "0 4px 15px rgba(0,0,0,0.3)",
          border: isOwn
            ? "1px solid rgba(167,139,250,0.2)"
            : "1px solid rgba(99,102,241,0.15)",
          position: "relative",
        }}
      >
        {/* Reply preview */}
        {msg.replyTo && (
          <div style={styles.replyPreview}>
            <div style={styles.replyLine} />
            <div style={styles.replyContent}>
              <span style={styles.replyName}>
                {msg.replyTo.senderId === currentUser?.uid
                  ? "You"
                  : otherUser?.displayName}
              </span>
              <span style={styles.replyText}>
                {msg.replyTo.text?.slice(0, 60)}
              </span>
            </div>
          </div>
        )}

        {/* Deleted for everyone */}
        {msg.deletedForEveryone ? (
          <div style={styles.deletedText}>
            🚫 {isOwn ? "You deleted this message" : "This message was deleted"}
          </div>
        ) : (
          <>
            {/* Text */}
            {msg.type === "text" && (
              <div style={{ ...styles.msgText, whiteSpace: "pre-wrap" }}>
                {msg.text}
                {msg.isEdited && (
                  <span style={styles.editedTag}> (edited)</span>
                )}
              </div>
            )}

            {/* Image */}
            {msg.type === "image" && msg.imageUrl && (
              <img src={msg.imageUrl} alt="sent" style={styles.image} />
            )}

            {/* Document */}
            {msg.type === "document" && msg.imageUrl && (
              <a
                href={msg.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.documentContainer}
              >
                <div style={styles.documentIcon}>
                  {getFileIcon(msg.fileType)}
                </div>
                <div style={styles.documentInfo}>
                  <div style={styles.documentName}>
                    {msg.fileName || "Document"}
                  </div>
                  <div style={styles.documentSize}>
                    {formatFileSize(msg.fileSize)} • Tap to open
                  </div>
                </div>
                <span style={styles.downloadIcon}>⬇️</span>
              </a>
            )}

            {/* View once */}
            {msg.type === "view_once" && (
              <div>
                {viewOnceOpened || msg.viewed ? (
                  <div style={styles.viewOnceOpened}>👁️ Opened</div>
                ) : (
                  <button
                    style={styles.viewOnceBtn}
                    onClick={isOwn ? null : handleViewOnce}
                    disabled={isOwn}
                  >
                    👁️ {isOwn ? "View Once Sent" : "Tap to View"}
                  </button>
                )}
              </div>
            )}

            {/* Love note */}
            {msg.type === "love_note" && (
              <div style={styles.loveNoteContainer}>
                {isOwn ? (
                  <div style={styles.loveNoteTag}>💌 Secret Love Note Sent</div>
                ) : msg.viewed && !loveNoteOpen ? (
                  <div style={styles.loveNoteViewed}>💌 Love note opened</div>
                ) : loveNoteOpen ? (
                  <>
                    <div style={styles.loveNoteTag}>💌 Secret Love Note</div>
                    <div style={styles.loveNoteText}>{msg.text}</div>
                    <div style={styles.loveNoteTimer}>
                      ⏳ Disappears in {formatCountdown(countdown)}
                    </div>
                  </>
                ) : (
                  <button
                    style={styles.loveNoteReadBtn}
                    onClick={handleOpenLoveNote}
                  >
                    💌 Open Secret Note
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Time + Status */}
        <div style={styles.footer}>
          <span style={styles.time}>{formatTime(msg.createdAt)}</span>
          {renderStatus()}
        </div>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            ...styles.menu,
            position: "absolute",
            bottom: "2%",
            right: isOwn ? 10 : "auto",
            left: isOwn ? "auto" : 10,

            zIndex: 999,
            marginTop: "4px",
          }}
        >
          <button
            style={styles.menuItem}
            onClick={() => {
              onReply();
              setShowMenu(false);
            }}
          >
            <span>↩</span> Reply
          </button>

          {isOwn && msg.type === "text" && !msg.deletedForEveryone && (
            <button
              style={styles.menuItem}
              onClick={() => {
                onEdit();
                setShowMenu(false);
              }}
            >
              <span>✏️</span> Edit
            </button>
          )}

          <button style={styles.menuItem} onClick={handleDeleteForMe}>
            <span>🗑️</span> Delete for me
          </button>

          {isOwn && (
            <button
              style={{ ...styles.menuItem, color: "#f87171" }}
              onClick={handleDeleteForEveryone}
            >
              <span>❌</span> Delete for everyone
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  tick: { fontSize: "11px", color: "rgba(255,255,255,0.5)" },
  replyPreview: {
    display: "flex",
    background: "rgba(0,0,0,0.2)",
    borderRadius: "8px",
    marginBottom: "6px",
    overflow: "hidden",
  },
  replyLine: { width: "3px", background: "#a78bfa", flexShrink: 0 },
  replyContent: {
    display: "flex",
    flexDirection: "column",
    padding: "4px 8px",
    gap: "2px",
  },
  replyName: { fontSize: "11px", color: "#a78bfa", fontWeight: "600" },
  replyText: { fontSize: "12px", color: "rgba(255,255,255,0.6)" },
  deletedText: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.4)",
    fontStyle: "italic",
  },
  msgText: {
    fontSize: "15px",
    color: "#f1f5f9",
    lineHeight: "1.5",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  },
  editedTag: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)",
    fontStyle: "italic",
  },
  image: {
    width: "100%",
    maxWidth: "260px",
    borderRadius: "12px",
    display: "block",
  },
  documentContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: "10px",
    padding: "10px",
    textDecoration: "none",
    minWidth: "180px",
    maxWidth: "240px",
  },
  documentIcon: { fontSize: "28px", flexShrink: 0 },
  documentInfo: { flex: 1, overflow: "hidden" },
  documentName: {
    color: "#f1f5f9",
    fontSize: "13px",
    fontWeight: "600",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  documentSize: {
    color: "rgba(255,255,255,0.5)",
    fontSize: "11px",
    marginTop: "2px",
  },
  downloadIcon: { fontSize: "16px", flexShrink: 0 },
  viewOnceBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(167,139,250,0.15)",
    border: "1px solid rgba(167,139,250,0.4)",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer",
    color: "#a78bfa",
    fontSize: "14px",
    fontWeight: "600",
    width: "100%",
  },
  viewOnceOpened: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "13px",
    padding: "4px 0",
  },
  loveNoteContainer: { padding: "4px 0" },
  loveNoteTag: {
    color: "#f472b6",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "6px",
  },
  loveNoteText: {
    color: "#f1f5f9",
    fontSize: "14px",
    lineHeight: "1.6",
    marginBottom: "8px",
  },
  loveNoteTimer: {
    color: "#f472b6",
    fontSize: "11px",
    fontStyle: "italic",
    textAlign: "right",
  },
  loveNoteReadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(244,114,182,0.15)",
    border: "1px solid rgba(244,114,182,0.4)",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer",
    color: "#f472b6",
    fontSize: "14px",
    fontWeight: "600",
    width: "100%",
  },
  loveNoteViewed: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "13px",
    padding: "4px 0",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "4px",
    marginTop: "6px",
  },
  time: { fontSize: "10px", color: "rgba(255,255,255,0.4)" },
  menu: {
    background: "#1e1b4b",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)",
    animation: "menuFadeIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
    minWidth: "170px",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "12px 16px",
    background: "transparent",
    border: "none",
    color: "#e9edef",
    fontSize: "14px",
    cursor: "pointer",
    textAlign: "left",
    borderBottom: "1px solid rgba(99,102,241,0.1)",
    transition: "background 0.15s",
  },
};

export default Message;
