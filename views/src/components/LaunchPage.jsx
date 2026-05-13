import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Activity, CheckCircle, Terminal, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LaunchPage() {
  const [running, setRunning] = useState(false);
  const [logs,    setLogs]    = useState([]);
  const navigate = useNavigate();

  const mockLogs = [
    'Conectando con fuentes de datos…',
    'Portafolio.co → Extrayendo noticias…',
    'La República → Capturando indicadores…',
    'Analizando sentimiento con NLP…',
    'Calculando índices de mercado…',
    'Actualizando modelo predictivo…',
    'Generando proyección TRM…',
  ];

  const startScraping = async () => {
    setRunning(true);
    fetch('http://localhost:8000/scraper/ejecutar', { method: 'POST' });
    for (let i = 0; i < mockLogs.length; i++) {
      await new Promise(r => setTimeout(r, 1000));
      setLogs(prev => [...prev, mockLogs[i]]);
    }
    setTimeout(() => navigate('/dashboard'), 1500);
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          alignItems: 'stretch',
        }}>

          {/* ── Left: description panel ── */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-solid"
            style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <span className="pill" style={{ width: 'fit-content' }}>
              <Sparkles size={11} /> Orquestación de datos
            </span>

            <div className="logo-icon" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem' }}>
              <Activity size={28} />
            </div>

            <h1 style={{
              fontFamily: 'var(--font-title)',
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
            }}>
              Preparar el análisis del mercado
            </h1>

            <p style={{ fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--text-2)', maxWidth: '420px' }}>
              Esta pantalla lanza la recolección de noticias, refresca el pipeline y deja listo el dashboard
              para leer señales, sentimiento y proyección TRM.
            </p>

            {/* Mini feature cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { icon: <Terminal size={15} />, label: 'Estado', sub: 'Scraper y modelo', color: 'var(--blue)' },
                { icon: <ShieldCheck size={15} />, label: 'Salida', sub: 'Datos listos en dashboard', color: 'var(--green)' },
              ].map(({ icon, label, sub, color }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.9rem',
                }}>
                  <span style={{ color }}>{icon}</span>
                  <p className="label" style={{ marginTop: '0.6rem' }}>{label}</p>
                  <p style={{ marginTop: '0.2rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-1)' }}>{sub}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Noticias', 'Indicadores', 'TRM'].map(t => (
                <span key={t} className="pill">{t}</span>
              ))}
            </div>

            {!running && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={startScraping}
                className="btn-primary"
                style={{ width: 'fit-content', padding: '0.9rem 1.75rem', marginTop: '0.25rem' }}
              >
                <Play size={17} fill="#fff" />
                Iniciar análisis
                <ArrowRight size={17} />
              </motion.button>
            )}
          </motion.section>

          {/* ── Right: terminal console ── */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="card"
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '420px' }}
          >
            {/* Terminal header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.02)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={14} style={{ color: 'var(--blue)' }} />
                <span className="label">Consola de proceso</span>
              </div>
              {running && (
                <span style={{
                  fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: 'var(--amber)',
                }}>Ejecutando…</span>
              )}
            </div>

            {/* Terminal body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem',
              fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
              fontSize: '0.72rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              background: 'rgba(0,0,0,0.25)',
            }}>
              {!running && logs.length === 0 ? (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', flexDirection: 'column', gap: '0.5rem',
                }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-2)', fontSize: '0.85rem' }}>El sistema está en espera</p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', lineHeight: 1.7, maxWidth: '280px' }}>
                    Pulsa <em>Iniciar análisis</em> para lanzar la captura de datos.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="log-line"
                      style={{ borderRadius: '0.5rem' }}
                    >
                      <CheckCircle size={12} style={{ color: 'var(--green)', flexShrink: 0, marginTop: '1px' }} />
                      <span style={{ color: 'var(--text-3)', minWidth: '70px' }}>
                        {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span style={{ color: 'var(--text-2)' }}>{log}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
