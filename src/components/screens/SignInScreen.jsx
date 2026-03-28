import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import styles from './SignInScreen.module.css';

export default function SignInScreen() {
  const navigate = useNavigate();

  const [showEmail,  setShowEmail]  = useState(false);
  const [email,      setEmail]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [error,      setError]      = useState('');

  // Redirect if already signed in
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/journal', { replace: true });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) navigate('/journal', { replace: true });
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  async function handleGoogle() {
    if (!supabase) { setError('Supabase is not configured.'); return; }
    setError('');
    // window.location.origin automatically adapts to any domain —
    // http://localhost:5173 in dev, https://playripple.com in prod.
    // No hardcoding needed. Supabase will redirect back here after OAuth.
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/journal` },
    });
    if (err) setError(err.message);
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!email.trim() || sending) return;
    if (!supabase) { setError('Supabase is not configured.'); return; }
    setSending(true);
    setError('');
    // Same as above — window.location.origin works on localhost and any
    // production domain without any code changes between environments.
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/journal` },
    });
    setSending(false);
    if (err) { setError(err.message); }
    else      { setSent(true); }
  }

  return (
    <div className={styles.root}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <Link to="/" className={styles.logo}>~ RIPPLE</Link>

        <div className={styles.card}>
          <h1 className={styles.heading}>Your decisions.<br />Your legacy.</h1>
          <p className={styles.sub}>Sign in to unlock your Ripple Journal and track your decision patterns across history.</p>

          {error && <div className={styles.error}>{error}</div>}

          {!showEmail ? (
            <>
              <button className={`${styles.authBtn} ${styles.authBtnGoogle}`} onClick={handleGoogle}>
                <span className={styles.googleG}>G</span>
                Continue with Google
              </button>

              <div className={styles.divider}>
                <div className={styles.dividerLine} />
                <span className={styles.dividerText}>or</span>
                <div className={styles.dividerLine} />
              </div>

              <button
                className={`${styles.authBtn} ${styles.authBtnEmail}`}
                onClick={() => setShowEmail(true)}
              >
                ✉ Continue with Email
              </button>
            </>
          ) : sent ? (
            <div className={styles.success}>
              ✅ Magic link sent to <strong>{email}</strong>.<br />
              Check your inbox and click the link to sign in.
            </div>
          ) : (
            <form className={styles.emailForm} onSubmit={handleEmailSubmit}>
              <input
                className={styles.emailInput}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
              <button className={styles.emailSubmit} type="submit" disabled={sending || !email.trim()}>
                {sending ? 'Sending…' : 'Send Magic Link →'}
              </button>
              <button
                type="button"
                onClick={() => setShowEmail(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(232,224,208,0.35)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← Back
              </button>
            </form>
          )}
        </div>

        <p className={styles.demoLink}>
          No account? <Link to="/demo">Try Demo instead →</Link>
        </p>
      </motion.div>
    </div>
  );
}
