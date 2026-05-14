import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ShieldCheck, ArrowRight, Activity, Globe2 } from 'lucide-react';
import logoImg from '../assets/FINSIGHT.png';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    try {
      const res = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', data.nombre);
        localStorage.setItem('rol', data.rol);
        navigate('/dashboard');
      } else {
        const err = await res.json();
        setError(err.detail || 'Acceso denegado');
      }
    } catch {
      setError('Sin conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
    }}>
      <div style={{ width: '100%', maxWidth: '1080px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
          alignItems: 'stretch',
        }}>

          {/* ── Left panel: branding ── */}
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="card-solid soft-grid"
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '520px',
            }}
          >
            {/* Glow orb */}
            <div style={{
              position: 'absolute', top: '-60px', right: '-60px',
              width: '280px', height: '280px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(79,140,255,0.18), transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: '-40px', left: '-40px',
              width: '200px', height: '200px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34,197,94,0.08), transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="pill"><Activity size={11} /> Market Intelligence Suite</span>

              <div style={{ marginTop: '2.5rem' }}>
                <div className="logo-mark logo-mark--hero" style={{ overflow:'hidden' }}>
                  <img src={logoImg} alt="FinSight logo" />
                </div>
                <h1 style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 0.95,
                  marginTop: '1.5rem',
                  color: 'var(--text-1)',
                }}>
                  FinSight <span style={{ color: 'var(--blue)' }}>Colombia</span>
                </h1>
                <p style={{
                  marginTop: '1rem',
                  fontSize: '0.875rem',
                  lineHeight: 1.8,
                  color: 'var(--text-2)',
                  maxWidth: '380px',
                }}>
                  Observa noticias, sentimiento y proyecciones TRM en una sola consola. Jerarquía visual clara, datos en tiempo real.
                </p>
              </div>

              {/* Feature mini-cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginTop: '2rem',
              }}>
                {[
                  { icon: <Activity size={16} />, label: 'Señales', sub: 'Noticias & mercado', color: 'var(--blue)' },
                  { icon: <Globe2 size={16} />, label: 'Cobertura', sub: 'Medios locales', color: 'var(--green)' },
                  { icon: <ShieldCheck size={16} />, label: 'Control', sub: 'Acceso seguro', color: 'var(--amber)' },
                ].map(({ icon, label, sub, color }) => (
                  <div key={label} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                  }}>
                    <span style={{ color }}>{icon}</span>
                    <p className="label" style={{ marginTop: '0.65rem' }}>{label}</p>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-1)' }}>{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem', position: 'relative', zIndex: 1 }}>
              {['TRM Forecasting', 'Sentiment Engine', 'Live Scraper'].map(t => (
                <span key={t} className="pill">{t}</span>
              ))}
            </div>
          </motion.section>

          {/* ── Right panel: login form ── */}
          <motion.section
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="card"
            style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <div style={{ marginBottom: '2rem' }}>
              <span className="pill"><ShieldCheck size={11} /> Acceso privado</span>
              <h2 style={{
                fontFamily: 'var(--font-title)',
                fontSize: '1.85rem',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                marginTop: '1.25rem',
              }}>
                Entrar al panel
              </h2>
              <p style={{ marginTop: '0.6rem', fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text-2)' }}>
                Usa tu correo corporativo para acceder al dashboard de análisis.
              </p>
            </div>

            {error && (
              <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Email */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Correo</label>
                <div className="relative">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="fs-input"
                    placeholder="analista@finsight.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="input-icon" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="fs-input"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ marginTop: '0.5rem', width: '100%', padding: '1rem' }}
              >
                {loading ? 'Validando acceso…' : 'Entrar al dashboard'}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            {/* Footer badge */}
            <div style={{
              marginTop: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span className="label">Entorno seguro</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--green)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                <ShieldCheck size={13} /> Enterprise
              </span>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
