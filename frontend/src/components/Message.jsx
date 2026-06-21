import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Message = ({ msg, isOwn, currentUser, otherUser, onReply, onEdit, onViewOnce, onSeen }) => {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [viewOnceOpened, setViewOnceOpened] = useState(msg.viewed);
  const deleteMenuRef = useRef(null);

  // Seen status update
  useEffect(() => {
    if (!isOwn && msg.status !== 'seen') {
      onSeen();
    }
  }, [msg.id]);

  // Outside click se delete menu band karo
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(e.target)) {
        setShowDeleteMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // View once handle
  const handleViewOnce = async () => {
    if (viewOnceOpened) return;
    setViewOnceOpened(true);
    onViewOnce(msg.imageUrl);
    try {
      await axios.patch(`${API_URL}/messages/view-once/${msg.id}`);
    } catch (err) {
      console.error('View once error:', err);
    }
  };

  // Delete for me
  const handleDeleteForMe = async () => {
    try {
      await axios.patch(`${API_URL}/messages/delete-for-me/${msg.id}`, {
        userId: currentUser.uid
      });
      setShowDeleteMenu(false);
    } catch (err) {
      console.error('Delete for me error:', err);
    }
  };

  // Delete for everyone
  const handleDeleteForEveryone = async () => {
    try {
      await axios.delete(`${API_URL}/messages/delete-for-everyone/${msg.id}`, {
        data: { senderId: currentUser.uid }
      });
      setShowDeleteMenu(false);
    } catch (err) {
      console.error('Delete for everyone error:', err);
    }
  };

  // Time format
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Status ticks
  const renderStatus = () => {
    if (!isOwn) return null;
    switch (msg.status) {
      case 'sent':
        return <span style={styles.statusTick}>✓</span>;
      case 'delivered':
        return <span style={styles.statusTick}>✓✓</span>;
      case 'seen':
        return <span style={{ ...styles.statusTick, color: '#53bdeb' }}>✓✓</span>;
      default:
        return null;
    }
  };

  // Agar deleted for me hai toh hide karo
  if (msg.deletedFor?.includes(currentUser?.uid)) {
    return null;
  }

  return (
    <div
      style={{
        ...styles.wrapper,
        justifyContent: isOwn ? 'flex-end' : 'flex-start'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        if (!showDeleteMenu) setShowActions(false);
      }}
    >

      {/* Action buttons */}
      {showActions && (
        <div style={{
          ...styles.actions,
          order: isOwn ? 0 : 1,
          marginRight: isOwn ? '8px' : '0',
          marginLeft: isOwn ? '0' : '8px'
        }}>
          <button style={styles.actionBtn} onClick={onReply} title="Reply">↩</button>
          {isOwn && msg.type === 'text' && !msg.deletedForEveryone && (
            <button style={styles.actionBtn} onClick={onEdit} title="Edit">✏️</button>
          )}
          <div style={{ position: 'relative' }} ref={deleteMenuRef}>
            <button
              style={styles.actionBtn}
              onClick={() => setShowDeleteMenu(!showDeleteMenu)}
              title="Delete"
            >
              🗑️
            </button>

            {/* Delete menu */}
            {showDeleteMenu && (
              <div style={{
                ...styles.deleteMenu,
                right: isOwn ? '0' : 'auto',
                left: isOwn ? 'auto' : '0'
              }}>
                <button
                  style={styles.deleteMenuItem}
                  onClick={handleDeleteForMe}
                >
                  Delete for me
                </button>
                {isOwn && (
                  <button
                    style={{ ...styles.deleteMenuItem, color: '#ef4444' }}
                    onClick={handleDeleteForEveryone}
                  >
                    Delete for everyone
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message bubble */}
      <div style={{
        ...styles.bubble,
        background: isOwn ? '#005c4b' : '#202c33',
        borderRadius: isOwn
          ? '12px 12px 0px 12px'
          : '12px 12px 12px 0px'
      }}>

        {/* Reply preview */}
        {msg.replyTo && (
          <div style={styles.replyPreview}>
            <div style={styles.replyLine} />
            <div style={styles.replyContent}>
              <span style={styles.replyName}>
                {msg.replyTo.senderId === currentUser?.uid ? 'You' : otherUser?.displayName}
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
            🚫 {isOwn ? 'You deleted this message' : 'This message was deleted'}
          </div>
        ) : (
          <>
            {/* Text message */}
            {msg.type === 'text' && (
              <div style={styles.messageText}>
                {msg.text}
                {msg.isEdited && (
                  <span style={styles.editedTag}> (edited)</span>
                )}
              </div>
            )}

            {/* Permanent image */}
            {msg.type === 'image' && msg.imageUrl && (
              <div style={styles.imageContainer}>
                <img src={msg.imageUrl} alt="sent" style={styles.image} />
              </div>
            )}

            {/* View once */}
            {msg.type === 'view_once' && (
              <div style={styles.viewOnceContainer}>
                {viewOnceOpened || msg.viewed ? (
                  <div style={styles.viewOnceOpened}>
                    <span>👁️</span>
                    <span style={styles.viewOnceText}>Opened</span>
                  </div>
                ) : (
                  <button
                    style={styles.viewOnceBtn}
                    onClick={isOwn ? null : handleViewOnce}
                    disabled={isOwn}
                  >
                    <span style={styles.viewOnceIcon}>👁️</span>
                    <span style={styles.viewOnceBtnText}>
                      {isOwn ? 'View Once Sent' : 'Tap to View'}
                    </span>
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
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    marginBottom: '4px',
    padding: '0 8px'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  actionBtn: {
    background: '#2a3942',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteMenu: {
    position: 'absolute',
    bottom: '32px',
    background: '#233138',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    zIndex: 100,
    minWidth: '160px',
    overflow: 'hidden'
  },
  deleteMenuItem: {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    color: '#e9edef',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'left'
  },
  bubble: {
    maxWidth: '65%',
    padding: '8px 12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
  },
  replyPreview: {
    display: 'flex',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
    marginBottom: '6px',
    overflow: 'hidden'
  },
  replyLine: {
    width: '3px',
    background: '#00a884',
    flexShrink: 0
  },
  replyContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: '4px 8px',
    gap: '2px'
  },
  replyName: {
    fontSize: '12px',
    color: '#00a884',
    fontWeight: '600'
  },
  replyText: {
    fontSize: '12px',
    color: '#8696a0'
  },
  deletedText: {
    fontSize: '13px',
    color: '#8696a0',
    fontStyle: 'italic'
  },
  messageText: {
    fontSize: '14px',
    color: '#e9edef',
    lineHeight: '1.5',
    wordBreak: 'break-word'
  },
  editedTag: {
    fontSize: '11px',
    color: '#8696a0',
    fontStyle: 'italic'
  },
  imageContainer: {
    borderRadius: '8px',
    overflow: 'hidden',
    maxWidth: '280px'
  },
  image: {
    width: '100%',
    display: 'block',
    borderRadius: '8px'
  },
  viewOnceContainer: {
    padding: '4px 0'
  },
  viewOnceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(0,168,132,0.15)',
    border: '1px solid #00a884',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    width: '100%'
  },
  viewOnceIcon: {
    fontSize: '20px'
  },
  viewOnceBtnText: {
    color: '#00a884',
    fontSize: '14px',
    fontWeight: '600'
  },
  viewOnceOpened: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    opacity: 0.5
  },
  viewOnceText: {
    color: '#8696a0',
    fontSize: '14px'
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '4px',
    marginTop: '4px'
  },
  time: {
    fontSize: '11px',
    color: '#8696a0'
  },
  statusTick: {
    fontSize: '12px',
    color: '#8696a0'
  }
};

export default Message;