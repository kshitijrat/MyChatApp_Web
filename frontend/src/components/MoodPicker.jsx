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
                background: selected === mood.text 
                  ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(124, 58, 237, 0.25) 100%)' 
                  : 'rgba(15, 12, 41, 0.4)',
                border: selected === mood.text 
                  ? '1px solid #7c3aed' 
                  : '1px solid rgba(99, 102, 241, 0.15)',
                boxShadow: selected === mood.text 
                  ? '0 0 12px rgba(124, 58, 237, 0.3)' 
                  : 'none'
              }}
              onClick={() => handleSelect(mood)}
              onMouseEnter={(e) => {
                if (selected !== mood.text) e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.4)';
              }}
              onMouseLeave={(e) => {
                if (selected !== mood.text) e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.15)';
              }}
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
            onFocus={(e) => {
              e.target.style.borderColor = '#7c3aed';
              e.target.style.boxShadow = '0 0 10px rgba(124, 58, 237, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)';
              e.target.style.boxShadow = 'none';
            }}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            e.currentTarget.style.color = '#fca5a5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#94a3b8';
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
    background: 'rgba(15, 12, 41, 0.6)',
    backdropFilter: 'blur(8px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end', // Bottom sheet feel style on mobile
    justifyContent: 'center'
  },
  container: {
    background: 'linear-gradient(135deg, #1e1b4b 0%, #110e2e 100%)',
    borderRadius: '24px 24px 0 0',
    padding: '24px',
    width: '100%',
    maxWidth: '460px',
    paddingBottom: '36px',
    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    borderTop: '1px solid rgba(167, 139, 250, 0.25)',
    borderLeft: '1px solid rgba(167, 139, 250, 0.15)',
    borderRight: '1px solid rgba(167, 139, 250, 0.15)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    color: '#f8fafc',
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '-0.3px'
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: 'none',
    color: '#94a3b8',
    fontSize: '14px',
    cursor: 'pointer',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
  },
  moodGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '20px'
  },
  moodBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  moodEmoji: {
    fontSize: '22px'
  },
  moodText: {
    color: '#e2e8f0',
    fontSize: '14px',
    fontWeight: '500'
  },
  customSection: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px'
  },
  customInput: {
    flex: 1,
    background: 'rgba(15, 12, 41, 0.5)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease'
  },
  saveBtn: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 20px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
    transition: 'opacity 0.2s'
  },
  clearBtn: {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '12px',
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default MoodPicker;