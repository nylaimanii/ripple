import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useGame } from '../../context/GameContext';
import styles from './RegretArchive.module.css';

const MAX_CHARS    = 200;
const BANNED_WORDS = ['hate', 'kill', 'slur'];

function containsBanned(text) {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(w => lower.includes(w));
}

// Stable deterministic rotation from entry id, range -3..+3 deg
function cardRotation(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
  return +((h % 60) / 10 - 3).toFixed(2);
}

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return ''; }
}

export default function RegretArchive() {
  const { setScreen } = useGame();

  const [entries,     setEntries]     = useState([]);
  const [playsCount,  setPlaysCount]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [text,        setText]        = useState('');
  const [submitted,   setSubmitted]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [confirmation, setConfirmation] = useState(false);
  const subRef = useRef(null);
  const didIncrementRef = useRef(false);

  // ── Fetch entries + increment plays on mount ─────────
  useEffect(() => {
    fetchEntries();
    incrementPlays();

    if (!supabase) return;
    const channel = supabase
      .channel('regret_archive_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'regret_archive' },
        payload => setEntries(prev => [payload.new, ...prev].slice(0, 20))
      )
      .subscribe();

    subRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchEntries() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('regret_archive')
      .select('id, text, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setEntries(data);
    setLoading(false);
  }

  async function incrementPlays() {
    if (!supabase || didIncrementRef.current) return;
    didIncrementRef.current = true;

    const { data: row } = await supabase
      .from('plays')
      .select('count')
      .eq('id', 1)
      .maybeSingle();

    const next = (row?.count ?? 0) + 1;
    await supabase.from('plays').upsert({ id: 1, count: next }, { onConflict: 'id' });
    setPlaysCount(next);
  }

  // ── Submit ────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (submitted || submitting) return;

    const trimmed = text.trim();
    setError('');

    if (!trimmed)                    { setError('Please write something first.'); return; }
    if (trimmed.length > MAX_CHARS)  { setError(`Keep it under ${MAX_CHARS} characters.`); return; }
    if (containsBanned(trimmed))     { setError('Your reflection was flagged. Please revise it.'); return; }

    setSubmitting(true);

    if (!supabase) {
      // Offline: add locally
      setEntries(prev => [
        { id: Date.now().toString(), text: trimmed, created_at: new Date().toISOString() },
        ...prev,
      ].slice(0, 20));
      finishSubmit();
      return;
    }

    const { error: insertErr } = await supabase
      .from('regret_archive')
      .insert([{ text: trimmed }]);

    if (insertErr) {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    } else {
      finishSubmit();
    }
  }

  function finishSubmit() {
    setText('');
    setSubmitting(false);
    setSubmitted(true);
    setConfirmation(true);
    setTimeout(() => setConfirmation(false), 3000);
  }

  return (
    <motion.div
      className={styles.root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => setScreen('dna')}
          aria-label="Back to Decision DNA"
        >
          ← Back to History
        </button>
        <h1 className={styles.title}>The Regret Archive</h1>
        <p className={styles.subtitle}>
          Anonymous reflections from players who stepped into history.
        </p>
      </div>

      {/* ── Plays counter ──────────────────────────────────── */}
      {playsCount !== null && (
        <motion.p
          className={styles.playsCounter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {playsCount.toLocaleString()} people have stepped into history
        </motion.p>
      )}

      {/* ── Corkboard wall ─────────────────────────────────── */}
      <div className={styles.wall} aria-label="Regret Archive reflections">
        {loading && (
          <p className={styles.wallMsg}>Loading archive…</p>
        )}
        {!loading && entries.length === 0 && (
          <p className={styles.wallMsg}>No reflections yet. Be the first.</p>
        )}
        <AnimatePresence>
          {entries.map(entry => (
            <motion.div
              key={entry.id}
              className={styles.card}
              style={{ '--rot': `${cardRotation(entry.id)}deg` }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.35 }}
            >
              <p className={styles.cardText}>{entry.text}</p>
              <span className={styles.cardDate}>{formatDate(entry.created_at)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Submit form ────────────────────────────────────── */}
      <div className={styles.formWrapper}>

        {/* Confirmation banner */}
        <AnimatePresence>
          {confirmation && (
            <motion.p
              className={styles.confirmation}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              Your reflection has been added.
            </motion.p>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={e => {
              if (e.target.value.length <= MAX_CHARS) setText(e.target.value);
            }}
            placeholder="What did stepping into history teach you?"
            rows={3}
            maxLength={MAX_CHARS}
            disabled={submitted}
            aria-label="Your reflection"
          />

          <div className={styles.formMeta}>
            <span
              className={styles.charCount}
              data-warn={text.length > MAX_CHARS * 0.9 ? 'true' : undefined}
            >
              {MAX_CHARS - text.length} / {MAX_CHARS}
            </span>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitted || submitting || !text.trim()}
          >
            {submitting ? 'Saving…' : submitted ? 'Reflection saved' : 'Leave Your Reflection'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
