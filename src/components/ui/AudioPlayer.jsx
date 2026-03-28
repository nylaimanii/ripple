import { useRef, useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import styles from './AudioPlayer.module.css';

/**
 * Placeholder audio player with Web Speech API fallback.
 * Shows a compact play/pause control with a waveform visualisation placeholder.
 *
 * TODO: Replace with ElevenLabs API call when ready:
 *
 * async function fetchElevenLabsAudio(text, voiceId) {
 *   const response = await fetch(
 *     `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
 *     {
 *       method: 'POST',
 *       headers: {
 *         'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY,
 *         'Content-Type': 'application/json',
 *       },
 *       body: JSON.stringify({
 *         text,
 *         model_id: 'eleven_monolingual_v1',
 *         voice_settings: { stability: 0.72, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
 *       }),
 *     }
 *   );
 *   const blob = await response.blob();
 *   return URL.createObjectURL(blob);
 * }
 *
 * Then set audioRef.current.src = await fetchElevenLabsAudio(text, voiceId);
 */
export default function AudioPlayer({ text, voiceId = 'VOICE_ID_NARRATOR', label = 'Narrator', autoPlay = false }) {
  const { isMuted } = useGame();
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [usingSpeechAPI, setUsingSpeechAPI] = useState(true);

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

    // TODO: Replace this block with ElevenLabs audio playback (see comment above)
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
      setUsingSpeechAPI(true);
    }
  }

  function stop() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlaying(false);
  }

  function toggle() {
    isPlaying ? stop() : play();
  }

  // TODO: When voiceId is provided and ElevenLabs key is set, log which voice would be used:
  // console.info(`[ElevenLabs] Voice: ${voiceId} | Character: ${label}`);

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

      {/* TODO: Remove this notice once ElevenLabs is integrated */}
      {usingSpeechAPI && (
        <span className={styles.placeholder} title={`TODO: Replace with ElevenLabs voice ID: ${voiceId}`}>
          TTS
        </span>
      )}
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
