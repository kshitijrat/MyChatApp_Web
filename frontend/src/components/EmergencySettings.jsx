import { useState, useEffect } from 'react';

const STORAGE_KEY = 'emergency_number';
const DEFAULT_NUMBER = '+919755345095';

const EmergencySettings = ({ onClose }) => {
  const [number, setNumber] = useState(localStorage.getItem(STORAGE_KEY) || DEFAULT_NUMBER);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, number);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>{animations}</style>
      <div style={styles.container} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>🚨 Emergency Configuration</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Emergency Call Number</label>
          <input
            style={styles.input}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="+91XXXXXXXXXX"
          />
          <p style={styles.hint}>This number will be triggered immediately when the emergency call option is selected.</p>
        </div>

        <button 
          style={{
            ...styles.saveBtn,
            background: saved ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : styles.saveBtn.background,
            boxShadow: saved ? '0 4px 15px rgba(16, 185, 129, 0.3)' : styles.saveBtn.boxShadow
          }} 
          onClick={handleSave}
        >
          {saved ? '✅ Configuration Saved!' : 'Secure Number'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', 
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(10, 10, 22, 0.8)', 
    backdropFilter: 'blur(12px)',
    zIndex: 1600, // Love letter se ek layer upar tak rha sake agar zarurat pade
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: '20px'
  },
  container: {
    background: 'linear-gradient(145deg, #1f1315 0%, #0f0809 100%)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderTop: '3px solid #ef4444',
    borderRadius: '24px',
    padding: '28px 24px', 
    width: '100%', 
    maxWidth: '380px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.1)',
    animation: 'settingsScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  header: {
    display: 'flex', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    marginBottom: '24px'
  },
  title: { 
    color: '#fff', 
    fontSize: '16px', 
    fontWeight: '700',
    letterSpacing: '-0.2px'
  },
  closeBtn: {
    background: 'transparent', 
    border: 'none',
    color: '#8696a0', 
    fontSize: '16px', 
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '50%',
    transition: 'all 0.2s',
    ':hover': { color: '#fff' }
  },
  section: { 
    marginBottom: '24px' 
  },
  label: {
    display: 'block', 
    color: '#ef4444', 
    fontSize: '12px', 
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px'
  },
  input: {
    width: '100%', 
    background: 'rgba(255, 255, 255, 0.04)', 
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px', 
    padding: '14px', 
    color: '#fff',
    fontSize: '15px', 
    outline: 'none', 
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    letterSpacing: '0.5px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
    ':focus': {
      border: '1px solid rgba(239, 68, 68, 0.5)',
      background: 'rgba(255, 255, 255, 0.06)'
    }
  },
  hint: {
    color: '#8696a0',
    fontSize: '11px',
    lineHeight: '1.4',
    marginTop: '8px',
    padding: '0 4px'
  },
  saveBtn: {
    width: '100%', 
    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
    border: 'none',
    borderRadius: '12px', 
    padding: '14px', 
    color: '#fff',
    fontSize: '15px', 
    fontWeight: '600', 
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
  }
};

const animations = `
  @keyframes settingsScale {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

export default EmergencySettings;