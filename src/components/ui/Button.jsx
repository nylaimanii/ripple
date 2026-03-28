import { motion } from 'framer-motion';
import styles from './Button.module.css';

/**
 * Primary button component.
 * variant: 'primary' | 'ghost' | 'choice' | 'danger'
 */
export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  tooltip = null,
  ...props
}) {
  return (
    <motion.button
      className={`${styles.btn} ${styles[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.03, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      title={tooltip}
      {...props}
    >
      {children}
      {tooltip && <span className={styles.tooltip}>{tooltip}</span>}
    </motion.button>
  );
}
