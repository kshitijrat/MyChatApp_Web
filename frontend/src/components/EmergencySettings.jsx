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
      <div style={styles.container} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>🚨 Emergency Settings</span>
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
        </div>

        <button style={styles.saveBtn} onClick={handleSave}>
          {saved ? '✅ Saved!' : 'Save Number'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)', zIndex: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px'
  },
  container: {
    background: '#202c33', borderRadius: '16px',
    padding: '24px', width: '100%', maxWidth: '400px'
  },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '20px'
  },
  title: { color: '#e9edef', fontSize: '16px', fontWeight: '700' },
  closeBtn: {
    background: 'transparent', border: 'none',
    color: '#8696a0', fontSize: '18px', cursor: 'pointer'
  },
  section: { marginBottom: '16px' },
  label: {
    display: 'block', color: '#8696a0',
    fontSize: '13px', marginBottom: '8px'
  },
  input: {
    width: '100%', background: '#2a3942', border: 'none',
    borderRadius: '8px', padding: '12px', color: '#e9edef',
    fontSize: '15px', outline: 'none', boxSizing: 'border-box'
  },
  saveBtn: {
    width: '100%', background: '#00a884', border: 'none',
    borderRadius: '8px', padding: '12px', color: '#fff',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer'
  }
};

export default EmergencySettings;