export const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(10, 5, 18, 0.85)',
    backdropFilter: 'blur(16px)',
    zIndex: 1500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    background: 'linear-gradient(145deg, #251125 0%, #0e0716 100%)',
    border: '1px solid rgba(255, 107, 157, 0.25)',
    borderRadius: '28px',
    padding: '32px 24px',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
    boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(255, 107, 157, 0.15)',
    animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  heartContainer: {
    fontSize: '50px',
    marginBottom: '10px',
    animation: 'pulse 1.5s infinite ease-in-out'
  },
  title: {
    color: '#fff',
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '-0.3px',
    background: 'linear-gradient(45deg, #ff758c 0%, #ff7eb3 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px'
  },
  divider: {
    color: '#ff6b9d',
    fontSize: '14px',
    opacity: 0.8,
    marginBottom: '20px'
  },
  letterContent: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '18px',
    borderRadius: '16px',
    textAlign: 'left',
    maxHeight: '280px',
    overflowY: 'auto',
    marginBottom: '24px',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
  },
  para: {
    color: '#e2e8f0',
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '14px',
    fontWeight: '400'
  },
  sign: {
    color: '#ff758c',
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '16px',
    textAlign: 'right',
    fontStyle: 'italic'
  },
  btnContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  acceptBtn: {
    background: 'linear-gradient(135deg, #ff5e62 0%, #ff9966 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '14px',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(255, 94, 98, 0.4)',
    transition: 'transform 0.2s'
  },
  notBtn: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  acceptedCard: {
    background: 'linear-gradient(145deg, #16222f 0%, #0b1118 100%)',
    border: '1px solid rgba(52, 211, 153, 0.3)',
    borderRadius: '28px',
    padding: '40px 24px',
    textAlign: 'center',
    maxWidth: '400px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(52, 211, 153, 0.15)'
  },
  acceptedEmoji: { fontSize: '64px', display: 'block', marginBottom: '16px' },
  acceptedTitle: { color: '#34d399', fontSize: '26px', fontWeight: '800', marginBottom: '12px' },
  acceptedText: { color: '#f1f5f9', fontSize: '15px', lineHeight: '1.6', marginBottom: '8px' },
  acceptedSub: { color: '#94a3b8', fontSize: '13px' },
  toast: {
    position: 'fixed',
    top: '30px',
    background: '#ef4444',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '30px',
    fontSize: '14px',
    fontWeight: '600',
    zIndex: 2000,
    boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)',
    animation: 'slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  }
};

// CSS animations string (Aapke animations variable ke liye)
export const animations = `
  @keyframes scaleUp {
    from { transform: scale(0.85); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  @keyframes slideDown {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes fall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
  }
`;