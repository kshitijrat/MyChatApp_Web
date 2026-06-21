import { useEffect } from 'react';

const ImageViewer = ({ imageUrl, onClose }) => {

  // Screenshot rokne ki koshish
  useEffect(() => {
    // Right click disable
    const handleContextMenu = (e) => e.preventDefault();

    // Screenshot key combinations disable
    const handleKeyDown = (e) => {
      // PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        navigator.clipboard.writeText('');
      }
      // Ctrl+S, Ctrl+P
      if (e.ctrlKey && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Auto close 10 seconds baad
    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div style={styles.overlay}>

      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.viewOnceLabel}>
          <span style={styles.eyeIcon}>👁️</span>
          <span style={styles.labelText}>View Once — closes in 10s</span>
        </div>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* Image — user select disable */}
      <div style={styles.imageWrapper}>
        <img
          src={imageUrl}
          alt="view once"
          style={styles.image}
          draggable={false}
        />
        {/* Transparent overlay — drag/save rokne ke liye */}
        <div style={styles.protectOverlay} />
      </div>

      {/* Bottom warning */}
      <div style={styles.bottomBar}>
        <span style={styles.warningText}>
          ⚠️ Screenshot is not allowed for view once photos
        </span>
      </div>

    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: '#000',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    userSelect: 'none',
    WebkitUserSelect: 'none'
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.05)'
  },
  viewOnceLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  eyeIcon: {
    fontSize: '20px'
  },
  labelText: {
    color: '#e9edef',
    fontSize: '14px',
    fontWeight: '500'
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#e9edef',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  image: {
    maxWidth: '90%',
    maxHeight: '80vh',
    objectFit: 'contain',
    pointerEvents: 'none'
  },
  protectOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    background: 'transparent'
  },
  bottomBar: {
    padding: '16px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.05)'
  },
  warningText: {
    color: '#8696a0',
    fontSize: '13px'
  }
};

export default ImageViewer;