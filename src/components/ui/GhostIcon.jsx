import { motion } from 'framer-motion';
import styles from './GhostIcon.module.css';

/**
 * Ghost icon that appears on the Ripple Score when
 * the player skipped the Unheard Room for a given choice.
 */
export default function GhostIcon({ count = 1, tooltip = 'You skipped the Unheard Room' }) {
  if (count === 0) return null;

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      title={tooltip}
      aria-label={tooltip}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className={styles.ghost}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
        >
          👻
        </motion.span>
      ))}
    </motion.div>
  );
}
