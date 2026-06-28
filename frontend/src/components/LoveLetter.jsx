import { useState } from 'react';
import { styles, animations } from '../styles/LoveLetterStyles';

const GIRL_EMAIL = 'user2@test.com';

const petalEmojis = ['🌹', '🌸', '💕', '✨', '🌺', '💗'];

// Component ke bahar — static array
const PETALS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  duration: 4 + Math.random() * 5,
  delay: `${Math.random() * 6}s`,
  emoji: petalEmojis[Math.floor(Math.random() * petalEmojis.length)],
  size: `${16 + Math.random() * 14}px`
}));

const funnyMessages = [
  "Arre nahi! ❌ Ye button toh sirf decoration ke liye hai! 😂",
  "Tumhara dil jaanta hai sach! 💕 Phir se socho!",
  "Nahi?? Main toh ro dunga! 😭🥺",
  "Ye button broken hai... try 'Accept' wala! 😇",
  "Error 404: 'Not Now' not found in your heart! 💝",
  "Tumhari aankhein keh rahi hain haan! 👀❤️",
  "Main maanunga nahi! 🥺💕",
];

const RosePetal = ({ style }) => (
  <div style={{
    position: 'fixed',
    fontSize: style.size,
    animation: `fall ${style.duration}s linear infinite`,
    left: style.left,
    top: '-40px',
    animationDelay: style.delay,
    zIndex: 1000,
    pointerEvents: 'none',
    filter: 'drop-shadow(0 2px 4px rgba(255,107,157,0.4))'
  }}>
    {style.emoji}
  </div>
);

const LoveLetter = ({ onClose, userEmail }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [notClickCount, setNotClickCount] = useState(0);

  if (userEmail !== GIRL_EMAIL) return null;

  const handleNotNow = () => {
    const msg = funnyMessages[notClickCount % funnyMessages.length];
    setToastMsg(msg);
    setShowToast(true);
    setNotClickCount(prev => prev + 1);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => onClose(), 3500);
  };

  return (
    <div style={styles.overlay}>
      <style>{animations}</style>

      {/* Rose Petals */}
      {PETALS.map(petal => (
        <RosePetal key={petal.id} style={petal} />
      ))}

      {!accepted ? (
        <div style={styles.card}>

          {/* Heart */}
          <div style={styles.heartContainer}>
            <span style={styles.heart}>💝</span>
          </div>

          {/* Title */}
          <h1 style={styles.title}>My Dearest Love</h1>
          <div style={styles.divider}>✦ 🌹 ✦</div>

          {/* Letter */}
          <div style={styles.letterContent}>
            <p style={styles.para}>
              Mere pyaarii cutiee, main jaanta hoon maine bahut galtiyan ki hain,
              aur kuch aisi baatein kahi jo nahi kehni chahiye thi. 💔
            </p>
            <p style={styles.para}>
              Par ek baat hamesha sach rahi hai — tum meri zindagi ka
              sabse khoobsurat hissa ho. Tumhare bina yeh sab adhura lagta hai. 🥺
            </p>
            <p style={styles.para}>
              Main jaanta hoon sorry kehna kaafi nahi hota, isliye maine
              yeh app bhi sirf tumhare liye banaya — kyunki tum special ho,
              aur tum deserve karti ho sab kuch best. 💕
            </p>
            <p style={styles.para}>
              Main promise karta hoon
              is baar sab theek karunga. 🌹
            </p>
            <p style={styles.sign}>— Tumhara, hamesha ❤️</p>
          </div>

          {/* Buttons */}
          <div style={styles.btnContainer}>
            <button style={styles.acceptBtn} onClick={handleAccept}>
              💝 Accept My Love
            </button>
            <button style={styles.notBtn} onClick={handleNotNow}>
              ❌ Not Now
            </button>
          </div>

        </div>
      ) : (
        <div style={styles.acceptedCard}>
          <span style={styles.acceptedEmoji}>🥰</span>
          <h2 style={styles.acceptedTitle}>Yay! 💕</h2>
          <p style={styles.acceptedText}>
            Tumne mera dil jeet liya! Main bahut khush hoon! 🌹
          </p>
          <p style={styles.acceptedSub}>Ab pyaar se baat karte hain... 💬</p>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div style={styles.toast}>{toastMsg}</div>
      )}

    </div>
  );
};

export default LoveLetter;