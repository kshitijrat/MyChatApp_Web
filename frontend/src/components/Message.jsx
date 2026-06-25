import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

// const API_URL = 'http://localhost:5000/api';
const API_URL = import.meta.env.VITE_API_URL;

const Message = ({ msg, isOwn, currentUser, otherUser, onReply, onEdit, onViewOnce, onSeen }) => {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [viewOnceOpened, setViewOnceOpened] = useState(msg.viewed);
  const deleteMenuRef = useRef(null);
  const [loveNoteOpen, setLoveNoteOpen] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 min = 600 seconds

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


  // Love note count down effect
  useEffect(() => {
    if (!loveNoteOpen) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
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

  // Love not Open karo
  const handleOpenLoveNote = async () => {
    setLoveNoteOpen(true);
    setCountdown(600);
    try {
      await axios.patch(`${API_URL}/messages/view-once/${msg.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  // count down display min or second
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `Disappears in ${mins} min ${secs} sec`;
    }
    return `Disappears in ${secs} sec`;
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

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word')) return '📘';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📗';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📙';
    if (fileType.includes('zip')) return '🗜️';
    if (fileType.includes('text')) return '📝';
    return '📄';
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

            {/* Document */}
            {/* Document */}
            {msg.type === 'document' && msg.imageUrl && (

              <a href={msg.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={msgStyles.documentContainer}
              >
                <div style={msgStyles.documentIcon}>
                  {getFileIcon(msg.fileType)}
                </div>
                <div style={msgStyles.documentInfo}>
                  <div style={msgStyles.documentName}>
                    {msg.fileName || 'Document'}
                  </div>
                  <div style={msgStyles.documentSize}>
                    {formatFileSize(msg.fileSize)} • Tap to open
                  </div>
                </div>
                <div style={msgStyles.downloadIcon}>⬇️</div>
              </a>
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


            {/* Love Note */}
            {msg.type === 'love_note' && (
              <div style={msgStyles.loveNoteContainer}>
                {isOwn ? (
                  <div style={msgStyles.loveNoteTag}>💌 Secret Love Note Sent</div>
                ) : msg.viewed && !loveNoteOpen ? (
                  <div style={msgStyles.loveNoteViewed}>💌 Love note opened</div>
                ) : loveNoteOpen ? (
                  <>
                    <div style={msgStyles.loveNoteTag}>💌 Secret Love Note</div>
                    <div style={msgStyles.loveNoteText}>{msg.text}</div>
                    <div style={msgStyles.loveNoteTimer}>
                      ⏳ {formatCountdown(countdown)}
                    </div>
                  </>
                ) : (
                  <button
                    style={msgStyles.loveNoteReadBtn}
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
    </div >
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


const msgStyles = {
  loveNoteContainer: {
    background: 'linear-gradient(135deg, #1a0a0f, #0f0f23)',
    border: '1px solid #ff6b9d60',
    borderRadius: '12px',
    padding: '12px',
    maxWidth: '260px',
    boxShadow: '0 0 20px rgba(255,107,157,0.15)'
  },
  loveNoteTag: {
    color: '#ff6b9d',
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '8px',
    letterSpacing: '0.5px'
  },
  loveNoteText: {
    color: '#e9edef',
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '10px'
  },
  loveNoteReadBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #ff6b9d, #ff8e53)',
    border: 'none',
    borderRadius: '8px',
    padding: '8px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  loveNoteViewed: {
    color: '#8696a0',
    fontSize: '13px',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '4px'
  },
  loveNoteTimer: {
    color: '#747071',
    fontSize: '11px',
    marginTop: '8px',
    fontStyle: 'italic',
    textAlign: 'right',
    fontWeight: '600'
  },
  documentContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '10px',
    padding: '10px',
    textDecoration: 'none',
    minWidth: '200px',
    maxWidth: '260px'
  },
  documentIcon: {
    fontSize: '32px',
    flexShrink: 0
  },
  documentInfo: {
    flex: 1,
    overflow: 'hidden'
  },
  documentName: {
    color: '#e9edef',
    fontSize: '13px',
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  documentSize: {
    color: '#8696a0',
    fontSize: '11px',
    marginTop: '2px'
  },
  downloadIcon: {
    fontSize: '16px',
    flexShrink: 0
  }
};

export default Message;