import { useRef, useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import styles from './AudioPlayer.module.css';

export default function AudioPlayer({ text, label = 'Narrator', autoPlay = false }) {
  const { isMuted } = useGame();
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Stop playback when muted
  useEffect(() => {
    if (isMuted) stop();
  }, [isMuted]);

  useEffect(() => {
    if (autoPlay && !isMuted) play();
    return () => stop();
  }, [text, autoPlay]);

  function play() {
    if (isMuted) return;

    if ('speechSynthesis' in window) {
      stop();
      const u = new SpeechSynthesisUtterance(text);
      u.rate  = 0.88;
      u.pitch = 0.95;
      u.volume = 0.9;
      u.onstart  = () => setIsPlaying(true);
      u.onend    = () => setIsPlaying(false);
      u.onerror  = () => setIsPlaying(false);
      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
    }
  }

  function stop() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlaying(false);
  }

  function toggle() {
    isPlaying ? stop() : play();
  }

  return (
    <div className={styles.player}>
      <button
        className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
        onClick={toggle}
        aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
        disabled={isMuted}
      >
        {isPlaying ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </button>

      <div className={styles.waveform} aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className={`${styles.bar} ${isPlaying ? styles.animating : ''}`}
            style={{ animationDelay: `${i * 0.06}s` }}
          />
        ))}
      </div>

      <span className={styles.label}>{label}</span>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2.5l10 5.5-10 5.5V2.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="2" width="4" height="12" rx="1" />
      <rect x="9" y="2" width="4" height="12" rx="1" />
    </svg>
  );
}
