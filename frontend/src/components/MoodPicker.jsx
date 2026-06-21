import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_MOODS = [
  { emoji: '💕', text: 'Missing you' },
  { emoji: '🌙', text: 'Thinking of you' },
  { emoji: '😊', text: 'Happy' },
  { emoji: '😔', text: 'Sad' },
  { emoji: '😤', text: 'Annoyed' },
  { emoji: '🥰', text: 'In love' },
  { emoji: '😴', text: 'Sleepy' },
  { emoji: '🔥', text: 'Excited' },
];

const MoodPicker = ({ onClose }) => {
  const { updateMood } = useAuth();
  const [customMood, setCustomMood] = useState('');
  const [selected, setSelected] = useState(null);

  const handleSelect = async (mood) => {
    setSelected(mood.text);
    await updateMood(`${mood.emoji} ${mood.text}`);
  };

  const handleCustomSave = async () => {
    if (!customMood.trim()) return;
    await updateMood(customMood);
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={e => e.stopPropagation()}>

        <div style={styles.header}>
          <span style={styles.title}>How are you feeling?</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Default moods */}
        <div style={styles.moodGrid}>
          {DEFAULT_MOODS.map((mood) => (
            <button
              key={mood.text}
              style={{
                ...styles.moodBtn,
                background: selected === mood.text ? '#00a88420' : '#2a3942',
                border: selected === mood.text ? '1px solid #00a884' : '1px solid transparent'
              }}
              onClick={() => handleSelect(mood)}
            >
              <span style={styles.moodEmoji}>{mood.emoji}</span>
              <span style={styles.moodText}>{mood.text}</span>
            </button>
          ))}
        </div>

        {/* Custom mood */}
        <div style={styles.customSection}>
          <input
            style={styles.customInput}
            placeholder="Custom mood... ✍️"
            value={customMood}
            onChange={(e) => setCustomMood(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomSave()}
          />
          <button style={styles.saveBtn} onClick={handleCustomSave}>
            Save
          </button>
        </div>

        {/* Clear mood */}
        <button
          style={styles.clearBtn}
          onClick={async () => {
            await updateMood('');
            onClose();
          }}
        >
          Clear mood
        </button>

      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  container: {
    background: '#202c33',
    borderRadius: '16px 16px 0 0',
    padding: '20px',
    width: '100%',
    maxWidth: '500px',
    paddingBottom: '32px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    color: '#e9edef',
    fontSize: '16px',
    fontWeight: '600'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#8696a0',
    fontSize: '18px',
    cursor: 'pointer'
  },
  moodGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginBottom: '16px'
  },
  moodBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  moodEmoji: {
    fontSize: '20px'
  },
  moodText: {
    color: '#e9edef',
    fontSize: '13px'
  },
  customSection: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px'
  },
  customInput: {
    flex: 1,
    background: '#2a3942',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#e9edef',
    fontSize: '14px',
    outline: 'none'
  },
  saveBtn: {
    background: '#00a884',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  clearBtn: {
    width: '100%',
    background: 'transparent',
    border: '1px solid #374045',
    borderRadius: '8px',
    padding: '10px',
    color: '#8696a0',
    fontSize: '13px',
    cursor: 'pointer'
  }
};

export default MoodPicker;