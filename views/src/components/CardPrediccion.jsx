import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ShieldCheck } from 'lucide-react';

const CardPrediccion = ({ titulo, valor, tendencia, confianza, icono: Icono }) => {
  const isUp   = tendencia === 'sube';
  const isDown = tendencia === 'baja';

  const accent = isUp
    ? { text: 'var(--green)', bg: 'var(--green-dim)', border: 'var(--green-border)', bar: '#22c55e' }
    : isDown
    ? { text: 'var(--red)',   bg: 'var(--red-dim)',   border: 'var(--red-border)',   bar: '#ef4444' }
    : { text: 'var(--blue)',  bg: 'var(--blue-dim)',  border: 'var(--blue-border)',  bar: '#4f8cff' };

  return (
    <div className="pred-card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <p className="label">{titulo}</p>
          <p style={{
            fontFamily: 'var(--font-title)',
            fontSize: '1.05rem',
            fontWeight: 800,
            color: 'var(--text-1)',
            marginTop: '0.3rem',
            lineHeight: 1.2,
          }}>
            {valor}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '2.5rem', height: '2.5rem',
          borderRadius: 'var(--radius-sm)',
          background: accent.bg,
          border: `1px solid ${accent.border}`,
        }}>
          <Icono size={18} style={{ color: accent.text }} />
        </div>
      </div>

      {/* Trend badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.25rem 0.65rem',
        borderRadius: '99px',
        background: accent.bg,
        border: `1px solid ${accent.border}`,
        color: accent.text,
        fontSize: '0.6rem',
        fontWeight: 800,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
      }}>
        {isUp   && <TrendingUp  size={11} />}
        {isDown && <TrendingDown size={11} />}
        {!isUp && !isDown && <Minus size={11} />}
        {tendencia}
      </div>

      {/* Confidence bar */}
      <div style={{ marginTop: '1.25rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'var(--text-3)',
          marginBottom: '0.5rem',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ShieldCheck size={10} style={{ color: 'var(--blue)' }} /> Confianza
          </span>
          <span style={{ color: 'var(--text-1)' }}>{confianza}%</span>
        </div>
        <div className="progress-track">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confianza}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="progress-fill"
            style={{ background: accent.bar }}
          />
        </div>
      </div>
    </div>
  );
};

export default CardPrediccion;
