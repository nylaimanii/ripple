import { useState, useEffect, useRef } from 'react';

/**
 * Typewriter animation hook.
 *
 * @param {string} text       - The full text to reveal.
 * @param {number} speed      - Ms per character (default 28).
 * @param {number} startDelay - Ms before typing starts (default 0).
 * @returns {{ displayText: string, isDone: boolean, skip: () => void }}
 */
export function useTypewriter(text = '', speed = 28, startDelay = 0) {
  const [displayText, setDisplayText] = useState('');
  const [isDone, setIsDone]           = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef(null);
  const delayRef = useRef(null);

  useEffect(() => {
    setDisplayText('');
    setIsDone(false);
    indexRef.current = 0;

    delayRef.current = setTimeout(() => {
      timerRef.current = setInterval(() => {
        indexRef.current += 1;
        if (indexRef.current <= text.length) {
          setDisplayText(text.slice(0, indexRef.current));
        }
        if (indexRef.current >= text.length) {
          clearInterval(timerRef.current);
          setIsDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(delayRef.current);
      clearInterval(timerRef.current);
    };
  }, [text, speed, startDelay]);

  const skip = () => {
    clearTimeout(delayRef.current);
    clearInterval(timerRef.current);
    setDisplayText(text);
    setIsDone(true);
    indexRef.current = text.length;
  };

  return { displayText, isDone, skip };
}
