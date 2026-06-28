export const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(135deg, #0d0015 0%, #1a0028 50%, #0d0015 100%)',
    zIndex: 500, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '16px',
    overflowY: 'auto'
  },
  card: {
    background: 'linear-gradient(160deg, #1e0a2e 0%, #12001f 60%, #1a0015 100%)',
    border: '1px solid rgba(255,107,157,0.3)',
    borderRadius: '28px', padding: '36px 24px',
    width: '100%', maxWidth: '400px',
    boxShadow: `
      0 0 0 1px rgba(255,107,157,0.1),
      0 20px 60px rgba(255,107,157,0.2),
      0 0 100px rgba(255,107,157,0.1),
      inset 0 1px 0 rgba(255,255,255,0.05)
    `,
    animation: 'fadeInCard 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
    position: 'relative', zIndex: 1001,
    backdropFilter: 'blur(20px)'
  },
  heartContainer: {
    textAlign: 'center', marginBottom: '20px'
  },
  heart: {
    fontSize: '64px',
    display: 'inline-block',
    animation: 'heartbeat 1.5s ease infinite',
    filter: 'drop-shadow(0 0 20px rgba(255,107,157,0.8))'
  },
  title: {
    color: '#ff6b9d',
    fontSize: '26px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '6px',
    fontFamily: 'Georgia, serif',
    letterSpacing: '1px',
    textShadow: '0 0 30px rgba(255,107,157,0.5)'
  },
  divider: {
    textAlign: 'center',
    color: '#ff6b9d60',
    fontSize: '18px',
    marginBottom: '24px',
    letterSpacing: '8px'
  },
  letterContent: {
    marginBottom: '28px',
    background: 'rgba(255,107,157,0.03)',
    borderRadius: '16px',
    padding: '20px 16px',
    border: '1px solid rgba(255,107,157,0.08)'
  },
  para: {
    color: '#e9edef',
    fontSize: '15px',
    lineHeight: '1.9',
    marginBottom: '16px',
    textAlign: 'center',
    fontFamily: 'Georgia, serif',
    opacity: 0.9
  },
  sign: {
    color: '#ff6b9d',
    fontSize: '16px',
    textAlign: 'right',
    fontStyle: 'italic',
    fontFamily: 'Georgia, serif',
    marginTop: '8px',
    textShadow: '0 0 20px rgba(255,107,157,0.4)'
  },
  btnContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  acceptBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #ff6b9d 0%, #ff4d8d 50%, #ff8e53 100%)',
    border: 'none',
    borderRadius: '14px',
    color: '#fff',
    fontSize: '17px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(255,107,157,0.4)',
    letterSpacing: '0.5px',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  notBtn: {
    width: '100%',
    padding: '14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    color: 'rgba(255,255,255,0.2)',
    fontSize: '14px',
    cursor: 'not-allowed',
    letterSpacing: '0.5px'
  },
  acceptedCard: {
    textAlign: 'center',
    animation: 'fadeInCard 0.6s ease',
    position: 'relative',
    zIndex: 1001,
    padding: '20px'
  },
  acceptedEmoji: {
    fontSize: '90px',
    marginBottom: '20px',
    animation: 'heartbeat 1s ease infinite',
    display: 'block',
    filter: 'drop-shadow(0 0 30px rgba(255,107,157,0.8))'
  },
  acceptedTitle: {
    color: '#ff6b9d',
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '16px',
    textShadow: '0 0 30px rgba(255,107,157,0.6)'
  },
  acceptedText: {
    color: '#e9edef',
    fontSize: '18px',
    marginBottom: '10px',
    fontFamily: 'Georgia, serif',
    lineHeight: '1.7'
  },
  acceptedSub: {
    color: '#8696a0',
    fontSize: '14px',
    marginTop: '8px'
  },
  toast: {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #1e0a2e, #12001f)',
    border: '1px solid rgba(255,107,157,0.4)',
    color: '#e9edef',
    padding: '14px 24px',
    borderRadius: '14px',
    fontSize: '14px',
    zIndex: 1002,
    textAlign: 'center',
    maxWidth: '300px',
    width: '90%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(255,107,157,0.2)',
    animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    lineHeight: '1.5'
  }
};

export const animations = `
  @keyframes fall {
    0% { 
      transform: translateY(-30px) rotate(0deg) scale(1); 
      opacity: 1; 
    }
    50% {
      transform: translateY(50vh) rotate(180deg) scale(0.8);
      opacity: 0.8;
    }
    100% { 
      transform: translateY(110vh) rotate(360deg) scale(0.6); 
      opacity: 0; 
    }
  }

  @keyframes fadeInCard {
    from { 
      opacity: 0; 
      transform: scale(0.85) translateY(30px); 
    }
    to { 
      opacity: 1; 
      transform: scale(1) translateY(0); 
    }
  }

  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    25% { transform: scale(1.15); }
    50% { transform: scale(1.05); }
    75% { transform: scale(1.2); }
  }

  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateX(-50%) translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateX(-50%) translateY(0); 
    }
  }

  @keyframes twinkle {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }
`;