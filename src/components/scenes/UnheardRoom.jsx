import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import TypewriterText from '../ui/TypewriterText';
import styles from './UnheardRoom.module.css';

export default function UnheardRoom({ characters, choiceNumber, onClose }) {
  const { visitUnheardRoom } = useGame();

  // ─── Web Speech API: queue all monologues in sequence ────
  useEffect(() => {
    if (!window.speechSynthesis || characters.length === 0) return;

    function enqueue(voices) {
      characters.forEach(char => {
        // TODO: Replace with ElevenLabs API call
        const utt = new SpeechSynthesisUtterance(char.monologue);
        utt.rate  = 0.85;
        utt.pitch = 0.9;
        const voice = voices.find(v =>
          /daniel|david|james|george|arthur|male|alex|fred/i.test(v.name)
        );
        if (voice) utt.voice = voice;
        window.speechSynthesis.speak(utt);
      });
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      enqueue(voices);
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        enqueue(window.speechSynthesis.getVoices());
      }, { once: true });
    }

    return () => { window.speechSynthesis.cancel(); };
  }, [characters]);

  // ─── Close: mark this choice as heard ────────────────────
  function handleClose() {
    window.speechSynthesis?.cancel();
    visitUnheardRoom(choiceNumber);
    onClose();
  }

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <motion.div
        className={styles.modal}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      >
        {/* Header */}
        <div className={styles.header}>
          <p className={styles.title}>The Unheard Room</p>
          <p className={styles.subtitle}>
            These are the people most affected by your decision.
          </p>
        </div>

        {/* Character list */}
        <div className={styles.characterList}>
          {characters.map((char, i) => (
            <div key={i} className={styles.characterCard}>
              {/* Portrait + identity row */}
              <div className={styles.identityRow}>
                <div
                  className={styles.portrait}
                  style={{ background: char.placeholderColor ?? '#1a1a2a' }}
                  aria-hidden="true"
                >
                  <span className={styles.initial}>
                    {char.name?.charAt(0) ?? '?'}
                  </span>
                </div>
                <div className={styles.identity}>
                  <p className={styles.name}>{char.name}</p>
                  <p className={styles.meta}>
                    {[char.age && `Age ${char.age}`, char.location]
                      .filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              {/* Monologue */}
              <TypewriterText
                text={`"${char.monologue}"`}
                speed={18}
                startDelay={600 + i * 3200}
                tag="blockquote"
                className={styles.monologue}
              />
            </div>
          ))}
        </div>

        {/* Close button */}
        <motion.button
          className={styles.closeBtn}
          onClick={handleClose}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          I've heard them. Close.
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
