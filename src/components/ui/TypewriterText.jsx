import { useTypewriter } from '../../hooks/useTypewriter';
import styles from './TypewriterText.module.css';

/**
 * Renders text with a typewriter reveal animation.
 * Clicking / tapping the text skips to the end instantly.
 */
export default function TypewriterText({
  text,
  speed = 28,
  startDelay = 0,
  className = '',
  onDone = null,
  tag: Tag = 'p',
  showCursor = true,
}) {
  const { displayText, isDone, skip } = useTypewriter(text, speed, startDelay);

  // Fire onDone callback once
  if (isDone && onDone) {
    // We call via a timeout so it doesn't run during render
    setTimeout(onDone, 0);
    onDone = null;
  }

  return (
    <Tag
      className={`${styles.text} ${className}`}
      onClick={skip}
      role="button"
      tabIndex={isDone ? -1 : 0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && skip()}
      aria-label={text}
    >
      {displayText}
      {showCursor && !isDone && <span className={styles.cursor} aria-hidden="true">|</span>}
    </Tag>
  );
}
