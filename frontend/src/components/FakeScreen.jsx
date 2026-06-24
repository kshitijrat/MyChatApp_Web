import { useState } from 'react';

const SECRET_CODE = '5516'; // Secret password

const FakeScreen = ({ onUnlock }) => {
  const [input, setInput] = useState('');
  const [display, setDisplay] = useState('0');
  const [shake, setShake] = useState(false);

  const buttons = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    'C', '0', '⌫'
  ];

  const handleBtn = (btn) => {
    if (btn === 'C') {
      setDisplay('0');
      setInput('');
      return;
    }

    if (btn === '⌫') {
      const newInput = input.slice(0, -1);
      setInput(newInput);
      setDisplay(newInput || '0');
      return;
    }

    const newInput = input + btn;
    setInput(newInput);
    setDisplay(newInput);

    // Secret code check karo
    if (newInput === SECRET_CODE) {
      onUnlock();
      return;
    }

    // 4 digits ho gaye aur galat code
    if (newInput.length >= 4 && newInput !== SECRET_CODE) {
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setInput('');
        setDisplay('0');
      }, 500);
    }
  };

  return (
    <div style={styles.container}>
      {/* Calculator Display */}
      <div style={styles.displayArea}>
        <div style={styles.appName}>Calculator</div>
        <div style={{
          ...styles.display,
          animation: shake ? 'shake 0.5s' : 'none'
        }}>
          {display}
        </div>
      </div>

      {/* Operator buttons */}
      <div style={styles.operatorRow}>
        {['%', '÷', '×', '−'].map(op => (
          <button key={op} style={styles.operatorBtn}>{op}</button>
        ))}
      </div>

      {/* Number buttons */}
      <div style={styles.grid}>
        {buttons.map((btn) => (
          <button
            key={btn}
            style={{
              ...styles.btn,
              background: btn === 'C' ? '#ff453a20' : '#2a3942',
              color: btn === 'C' ? '#ff453a' : '#e9edef'
            }}
            onClick={() => handleBtn(btn)}
          >
            {btn}
          </button>
        ))}
        <button
          style={{ ...styles.btn, background: '#00a88420', color: '#00a884' }}
          onClick={() => handleBtn('=')}
        >
          =
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex', flexDirection: 'column',
    height: '100dvh', background: '#1c1c1e',
    padding: '20px', justifyContent: 'flex-end'
  },
  appName: {
    color: '#8696a0', fontSize: '14px',
    textAlign: 'center', marginBottom: '8px'
  },
  displayArea: { marginBottom: '20px' },
  display: {
    color: '#ffffff', fontSize: '56px',
    fontWeight: '300', textAlign: 'right',
    padding: '0 8px', wordBreak: 'break-all'
  },
  operatorRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px', marginBottom: '12px'
  },
  operatorBtn: {
    background: '#ff9f0a20', border: 'none',
    borderRadius: '50%', height: '72px',
    color: '#ff9f0a', fontSize: '24px', cursor: 'pointer'
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  btn: {
    border: 'none', borderRadius: '50%',
    height: '72px', fontSize: '24px',
    cursor: 'pointer', fontWeight: '400'
  }
};

export default FakeScreen;