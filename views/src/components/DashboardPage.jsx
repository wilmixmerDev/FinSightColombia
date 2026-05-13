import React, { useState, useEffect, useMemo, useRef } from 'react';

import {
  RefreshCw, Users, Activity, Zap, BarChart3, Database,
  LogOut, Terminal, CheckCircle, ArrowUpRight, TrendingUp,
  Inbox, ExternalLink,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API = 'http://127.0.0.1:8000';
const now = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function DashboardPage() {
  const [noticias,            setNoticias]            = useState([]);
  const [predicciones,        setPredicciones]        = useState([]);
  const [mercadoHistorico,    setMercadoHistorico]    = useState([]);
  const [historialSentimiento,setHistorialSentimiento]= useState([]);
  const [fuenteSeleccionada,  setFuenteSeleccionada]  = useState('Todas');
  const [tabActiva,        setTabActiva]        = useState('noticias');
  const [scraping,         setScraping]         = useState(false);
  const [scraperDone,      setScraperDone]      = useState(false);
  const [logs,             setLogs]             = useState([]);
  const [cargando,         setCargando]         = useState(true);
  const logsRef = useRef(null);
  const navigate = useNavigate();

  const esAdmin = localStorage.getItem('rol') === 'admin';
  const usuario = localStorage.getItem('user') || 'Analista';

  const noticiasPositivas = noticias.filter(n => n.sentimiento === 'POS').length;
  const positivePct = noticias.length ? Math.round((noticiasPositivas / noticias.length) * 100) : 0;
  const trmActual   = mercadoHistorico[0]?.valor ?? null;
  const ultimaFecha = mercadoHistorico[0]?.fecha
    ? new Date(String(mercadoHistorico[0].fecha).slice(0,10)+'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    : '—';

  const fuentes = ['Todas', 'Portafolio', 'La República', 'El Tiempo', 'Semana'];

  const cargarDatos = async () => {
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch(`${API}/noticias/?limit=30`).then(r => r.json()).catch(() => []),
        fetch(`${API}/prediccion/actual`).then(r => r.json()).catch(() => []),
        fetch(`${API}/mercado/historico?variable=TRM&limit=15`).then(r => r.json()).catch(() => []),
        fetch(`${API}/noticias/sentimiento-historial?tema=TRM`).then(r => r.json()).catch(() => []),
      ]);
      setNoticias(Array.isArray(r1) ? r1 : []);
      setPredicciones(Array.isArray(r2) && r2.length > 0 ? r2 : []);
      setMercadoHistorico(Array.isArray(r3) ? r3 : []);
      setHistorialSentimiento(Array.isArray(r4) ? r4 : []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const iniciarScraping = async () => {
    setScraping(true); setScraperDone(false); setLogs([]);
    await fetch(`${API}/scraper/ejecutar`, { method: 'POST' }).catch(() => {});
    let backendLogs = []; let attempts = 0;
    while (attempts < 120) {
      await new Promise(r => setTimeout(r, 1500));
      try {
        const res  = await fetch(`${API}/scraper/logs`);
        const data = await res.json();
        backendLogs = data.logs || [];
        const ts = now();
        setLogs(backendLogs.map(msg => ({ ts, msg })));
        if (!data.running && backendLogs.length > 0) break;
      } catch (e) { console.error(e); }
      attempts++;
    }
    if (backendLogs.length > 0) {
      setLogs([]);
      for (let i = 0; i < backendLogs.length; i++) {
        await new Promise(r => setTimeout(r, 250));
        setLogs(prev => [...prev, { ts: now(), msg: backendLogs[i] }]);
      }
    }
    await new Promise(r => setTimeout(r, 800));
    await cargarDatos();
    setScraping(false); setScraperDone(true);
  };

  const limpiarBD = async () => {
    if (!window.confirm('¿Limpiar datos? Se eliminarán noticias, predicciones e índices.\nLos datos TRM históricos se conservarán.')) return;
    await fetch(`${API}/scraper/limpiar`, { method: 'POST' });
    setNoticias([]); setPredicciones([]);
    setScraperDone(false); setLogs([]);
    // Reload market data (should still be intact)
    const r = await fetch(`${API}/mercado/historico?variable=TRM&limit=15`).then(r => r.json()).catch(() => []);
    setMercadoHistorico(Array.isArray(r) ? r : []);
  };

  useEffect(() => { cargarDatos(); }, []);
  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const noticiasFiltradas = useMemo(() => {
    if (fuenteSeleccionada === 'Todas') return noticias;
    return noticias.filter(n => n.fuente === fuenteSeleccionada);
  }, [noticias, fuenteSeleccionada]);

  // Chart data
  const trmChartData = useMemo(() => {
    const asc = [...mercadoHistorico].reverse();
    if (!asc.length) return null;
    const predTRM  = predicciones.find(p => p.variable === 'TRM');
    const lastVal  = asc[asc.length - 1]?.valor || 0;
    const projected = predTRM?.prediccion === 'sube' ? lastVal * 1.006
      : predTRM?.prediccion === 'baja' ? lastVal * 0.994 : lastVal;
    const projColor = predTRM?.prediccion === 'sube' ? '#22c55e' : '#ef4444';
    return {
      labels: [
        ...asc.map(m => new Date(String(m.fecha).slice(0,10)+'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })),
        'Mañana',
      ],
      datasets: [
        {
          label: 'TRM Histórica',
          data: [...asc.map(m => m.valor), null],
          borderColor: '#4f8cff',
          borderWidth: 2.5,
          backgroundColor: ctx => {
            const { ctx: c, chartArea } = ctx.chart;
            if (!chartArea) return 'transparent';
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, 'rgba(79,140,255,0.20)');
            g.addColorStop(1, 'rgba(79,140,255,0)');
            return g;
          },
          fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5,
          pointHoverBackgroundColor: '#4f8cff',
        },
        {
          label: 'Proyección',
          data: [...asc.map(() => null).slice(0, -1), lastVal, projected],
          borderColor: projColor,
          borderWidth: 2.5,
          borderDash: [7, 4],
          tension: 0.4,
          pointRadius: ctx => ctx.dataIndex === asc.length ? 7 : 0,
          pointBackgroundColor: projColor,
          pointBorderColor: '#060d19',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [mercadoHistorico, predicciones]);

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0d1825',
        borderColor: 'rgba(79,140,255,0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        callbacks: {
          label: ctx => ` $${Number(ctx.raw).toLocaleString('es-CO')}`,
        },
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: { color: '#475569', font: { size: 10, family: 'Inter' }, callback: v => `$${Number(v).toLocaleString()}` },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#475569', font: { size: 10, family: 'Inter' } },
        border: { display: false },
      },
    },
  };

  const [seedingTRM, setSeedingTRM] = useState(false);
  const seedTRM = async () => {
    setSeedingTRM(true);
    try {
      const r = await fetch(`${API}/scraper/seed-trm?dias=90`, { method:'POST' });
      const d = await r.json();
      console.log('Seed TRM:', d);
      await cargarDatos();
    } catch(e) { console.error(e); }
    finally { setSeedingTRM(false); }
  };

  const EmptyState = ({ text }) => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.6rem', padding:'2rem 1rem', color:'var(--text-3)' }}>
      <Inbox size={26} style={{ opacity:0.35 }} />
      <p style={{ fontSize:'0.76rem', fontWeight:600, textAlign:'center' }}>{text}</p>
    </div>
  );



  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:'var(--font-sans)', color:'var(--text-1)', background:'var(--bg)' }}>

      <aside style={{
        width:'72px', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center',
        gap:'0.75rem', margin:'0.75rem 0 0.75rem 0.75rem', padding:'1.25rem 0.75rem',
        background:'var(--bg-sidebar)', border:'1px solid var(--border)', borderRadius:'1.5rem',
        backdropFilter:'var(--blur)',
      }}>
        <div className="logo-icon" style={{ marginBottom:'0.5rem' }}><Zap size={20} fill="currentColor" /></div>
        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:'0.4rem', width:'100%' }}>
          <button className="icon-btn active" title="Dashboard"><BarChart3 size={20} /></button>
          {esAdmin && <button className="icon-btn" onClick={() => navigate('/usuarios')} title="Usuarios"><Users size={20} /></button>}
          <button className="icon-btn" onClick={() => setTabActiva('mercado')} title="Datos históricos TRM"><Database size={20} /></button>
        </nav>
        <button className="icon-btn danger" onClick={() => { localStorage.clear(); navigate('/login'); }} title="Cerrar sesión">
          <LogOut size={20} />
        </button>
      </aside>

      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <header className="card" style={{
          margin:'0.75rem 0.75rem 0 0.75rem', borderRadius:'1.5rem',
          padding:'0.85rem 1.5rem', display:'flex', alignItems:'center',
          justifyContent:'space-between', gap:'1rem', flexShrink:0,
        }}>
          <div>
            <span className="pill" style={{ display:'inline-flex', marginBottom:'0.35rem' }}>
              <Activity size={11} /> Panel operativo
            </span>
            <h1 style={{ fontFamily:'var(--font-title)', fontSize:'1.5rem', fontWeight:900, letterSpacing:'-0.04em' }}>
              FinSight <span style={{ color:'var(--blue)' }}>Colombia</span>
            </h1>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.12rem' }}>
              <span className="label">{new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })}</span>
              <span className="dot-live" />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
            <div style={{ padding:'0.45rem 0.85rem', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', textAlign:'right' }}>
              <p style={{ fontSize:'0.68rem', fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--text-1)' }}>{usuario}</p>
              <p style={{ fontSize:'0.57rem', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--text-3)', marginTop:'0.1rem' }}>{esAdmin ? 'Administrador' : 'Analista'}</p>
            </div>
            <button className="btn-ghost" onClick={limpiarBD}>Limpiar BD</button>
            <button className="btn-primary" onClick={iniciarScraping} disabled={scraping || scraperDone} style={{ whiteSpace:'nowrap' }}>
              <RefreshCw size={14} style={{ animation: scraping ? 'spin 1s linear infinite' : 'none' }} />
              {scraping ? 'Extrayendo datos…' : scraperDone ? 'Datos actualizados' : 'Extraer datos'}
            </button>
          </div>
        </header>

        {/* Content grid */}
        <div style={{
          flex:1, minHeight:0, overflow:'hidden', display:'grid',
          gridTemplateColumns:'1fr 296px', gap:'0.75rem', padding:'0.75rem',
        }}>

          <main style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.75rem' }}>

            {/* 1 ── Terminal de logs (arriba de todo) */}
            <div className="card" style={{ overflow:'hidden', padding:0, flexShrink:0 }}>
              {/* Terminal header */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'0.65rem 1.1rem', borderBottom:'1px solid var(--border)',
                background:'rgba(0,0,0,0.30)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <Terminal size={13} style={{ color:'var(--blue)' }} />
                  <span className="label">Registro de extracción</span>
                </div>
                {/* Estado del proceso */}
                {scraping && (
                  <div style={{ display:'flex', alignItems:'center', gap:'0.45rem' }}>
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'var(--amber)' }}
                    />
                    <span style={{ fontSize:'0.58rem', fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--amber)' }}>Procesando</span>
                  </div>
                )}
                {scraperDone && !scraping && (
                  <span style={{ display:'flex', alignItems:'center', gap:'0.35rem', color:'var(--green)', fontSize:'0.58rem', fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase' }}>
                    <CheckCircle size={11} /> Completado
                  </span>
                )}
              </div>

              {/* Log lines */}
              <div
                ref={logsRef}
                style={{
                  height: logs.length > 0 ? '210px' : '56px',
                  overflowY:'auto',
                  background:'rgba(0,0,0,0.42)',
                  padding:'0.7rem 1rem',
                  fontFamily:"'Courier New',monospace",
                  fontSize:'0.69rem',
                  display:'flex',
                  flexDirection:'column',
                  gap:'0.3rem',
                  transition:'height 0.35s cubic-bezier(0.4,0,0.2,1)',
                  scrollbarColor:'rgba(148,163,184,0.15) transparent',
                }}
              >
                {logs.length === 0 ? (
                  <p style={{ color:'var(--text-3)', fontStyle:'italic', lineHeight:1.5 }}>
                    {scraping ? 'Conectando con el servidor…' : 'Presiona Sincronizar para iniciar la extracción de datos.'}
                  </p>
                ) : (
                  <AnimatePresence initial={false}>
                    {logs.map((l, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -16, y: -4 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        style={{ display:'flex', gap:'0.6rem', alignItems:'flex-start' }}
                      >
                        <span style={{ color:'var(--text-3)', minWidth:'60px', flexShrink:0 }}>{l.ts}</span>
                        <span style={{
                          color: l.msg.includes('✓') || l.msg.includes('OK') ? '#4ade80'
                            : l.msg.includes('✗') || l.msg.toLowerCase().includes('error') ? '#f87171'
                            : l.msg.startsWith('===') ? '#93c5fd'
                            : 'var(--text-2)',
                          fontWeight: l.msg.startsWith('===') ? 700 : 400,
                        }}>
                          {l.msg}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* 2 ── Stats bar */}
            <div className="card" style={{ padding:'0.8rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.6rem' }}>

                {/* Noticias cargadas */}
                <div className="stat-cell">
                  <p className="stat-cell-label">Noticias cargadas</p>
                  <p className="stat-cell-value">{noticias.length}</p>
                  {noticias.length > 0
                    ? <span className="stat-cell-badge badge-neutral">{[...new Set(noticias.map(n=>n.fuente))].length} fuentes</span>
                    : <span style={{ fontSize:'0.68rem', color:'var(--text-3)', marginTop:'0.4rem', display:'block' }}>Sin datos aún</span>
                  }
                </div>

                {/* Sentimiento */}
                <div className="stat-cell">
                  <p className="stat-cell-label">Sentimiento positivo</p>
                  <p className="stat-cell-value">{noticias.length > 0 ? `${positivePct}%` : '—'}</p>
                  {noticias.length > 0
                    ? <span className={`stat-cell-badge ${positivePct >= 50 ? 'badge-green' : 'badge-red'}`}>{noticiasPositivas} positivas</span>
                    : <span style={{ fontSize:'0.68rem', color:'var(--text-3)', marginTop:'0.4rem', display:'block' }}>Extrae datos primero</span>
                  }
                </div>

                {/* TRM */}
                <div className="stat-cell">
                  <p className="stat-cell-label">TRM actual</p>
                  {trmActual
                    ? <>
                        <p className="stat-cell-value">${trmActual.toLocaleString('es-CO')}</p>
                        <span className="stat-cell-badge badge-blue">{ultimaFecha}</span>
                      </>
                    : <>
                        <p style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--text-3)', marginTop:'0.6rem' }}>Sin datos</p>
                        <button
                          onClick={seedTRM}
                          disabled={seedingTRM}
                          style={{
                            marginTop:'0.5rem', fontSize:'0.58rem', fontWeight:800, letterSpacing:'0.12em',
                            textTransform:'uppercase', color:'var(--blue)', background:'var(--blue-dim)',
                            border:'1px solid var(--blue-border)', borderRadius:'99px', padding:'0.2rem 0.65rem',
                            cursor:'pointer', opacity: seedingTRM ? 0.6 : 1,
                          }}
                        >
                          {seedingTRM ? 'Cargando…' : '↓ Cargar TRM'}
                        </button>
                      </>
                  }
                </div>

              </div>
            </div>


            {/* 4 ── Análisis del Día */}
            {(() => {
              const predTRM = predicciones.find(p => p.variable === 'TRM');
              if (!predTRM) return null;
              const confianza = Math.round(predTRM.confianza * 100);
              const dir = predTRM.prediccion === 'sube' ? 'SUBA' : predTRM.prediccion === 'baja' ? 'BAJE' : 'SE MANTENGA';
              const color = predTRM.prediccion === 'sube' ? 'var(--green)' : predTRM.prediccion === 'baja' ? 'var(--red)' : 'var(--blue)';
              const fuentesStr = [...new Set(noticias.map(n => n.fuente))].slice(0,3).join(', ');
              const hoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
              return (
                <motion.div
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                  className="card"
                  style={{
                    padding:'1.1rem 1.25rem',
                    borderLeft: `3px solid ${color}`,
                    display:'flex', gap:'1rem', alignItems:'flex-start',
                  }}
                >
                  <div style={{ flexShrink:0, width:32, height:32, borderRadius:'0.6rem', background: predTRM.prediccion === 'sube' ? 'var(--green-dim)' : 'var(--red-dim)', border:`1px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <ArrowUpRight size={16} style={{ color, transform: predTRM.prediccion === 'baja' ? 'rotate(90deg)' : 'none' }} />
                  </div>
                  <div>
                    <p className="label" style={{ marginBottom:'0.35rem' }}>Análisis del día — {hoy}</p>
                    <p style={{ fontSize:'0.82rem', lineHeight:1.7, color:'var(--text-2)' }}>
                      Con base en el análisis de{' '}
                      <strong style={{ color:'var(--text-1)' }}>{noticias.length} noticias</strong>{' '}
                      {fuentesStr ? `de fuentes como ${fuentesStr},` : ''}{' '}
                      junto con el histórico de los últimos{' '}
                      <strong style={{ color:'var(--text-1)' }}>{mercadoHistorico.length} días</strong>{' '}
                      del mercado, el modelo estima una probabilidad del{' '}
                      <strong style={{ color }}>{confianza}%</strong>{' '}de que la TRM{' '}
                      <strong style={{ color }}>{dir}</strong>{' '}en la próxima jornada.
                    </p>
                  </div>
                </motion.div>
              );
            })()}

            {/* 5 ── Sentimiento de Mercado (neon line) */}
            {historialSentimiento.length > 0 && (() => {
              const asc = [...historialSentimiento].reverse();
              const sentData = {
                labels: asc.map(s => new Date(s.fecha).toLocaleDateString('es-CO', { day:'numeric', month:'short' })),
                datasets: [{
                  label: 'Índice de sentimiento',
                  data: asc.map(s => s.indice ?? s.valor ?? 0),
                  borderColor: '#06b6d4',
                  borderWidth: 2.5,
                  backgroundColor: ctx => {
                    const { ctx: c, chartArea } = ctx.chart;
                    if (!chartArea) return 'transparent';
                    const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    g.addColorStop(0, 'rgba(6,182,212,0.22)');
                    g.addColorStop(1, 'rgba(6,182,212,0)');
                    return g;
                  },
                  fill: true, tension: 0.5, pointRadius: 0, pointHoverRadius: 5,
                  pointHoverBackgroundColor: '#06b6d4',
                }],
              };
              const sentOpts = {
                ...chartOpts,
                scales: {
                  y: { grid: { color:'rgba(6,182,212,0.07)' }, ticks: { color:'#475569', font:{ size:10 } }, border:{ display:false } },
                  x: { grid: { display:false }, ticks: { color:'#475569', font:{ size:10 } }, border:{ display:false } },
                },
              };
              return (
                <div className="card" style={{ padding:'1.1rem 1.25rem', flexShrink:0 }}>
                  <div style={{ marginBottom:'0.75rem' }}>
                    <h3 style={{ fontFamily:'var(--font-title)', fontSize:'1rem', fontWeight:900, letterSpacing:'-0.03em', color:'#06b6d4' }}>Sentimiento de Mercado</h3>
                    <p style={{ color:'var(--text-3)', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.18em', fontWeight:700, marginTop:'0.15rem' }}>Impacto mediático · TRM</p>
                  </div>
                  <div style={{ width:'100%', height:'180px', position:'relative' }}>
                    <Line data={sentData} options={sentOpts} />
                  </div>
                </div>
              );
            })()}

            {/* 6 ── TRM Projection Chart */}
            <div className="card" style={{ padding:'1.25rem', position:'relative', overflow:'visible', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1rem', gap:'1rem' }}>
                <div>
                  <h3 style={{ fontFamily:'var(--font-title)', fontSize:'1.15rem', fontWeight:900, letterSpacing:'-0.03em', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                    Motor de proyección TRM <ArrowUpRight size={17} style={{ color:'var(--blue)' }} />
                  </h3>
                  <p style={{ color:'var(--text-2)', fontSize:'0.76rem', marginTop:'0.2rem' }}>
                    Pronóstico basado en análisis de sentimiento multi-fuente
                  </p>
                </div>
                {trmActual && noticias.length > 0 && (() => {
                  const isPos = positivePct >= 50;
                  const pct   = isPos ? positivePct : (100 - positivePct);
                  const label = isPos ? 'positivo' : 'negativo';
                  const col   = isPos ? 'var(--green)' : 'var(--red)';
                  const bg    = isPos ? 'var(--green-dim)' : 'var(--red-dim)';
                  const border= isPos ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)';
                  return (
                    <div style={{ flexShrink:0, padding:'0.55rem 0.9rem', background:bg, border:border, borderRadius:'var(--radius-md)', textAlign:'right' }}>
                      <p className="label" style={{ color:col }}>Sentimiento</p>
                      <p style={{ fontFamily:'var(--font-title)', fontSize:'0.95rem', fontWeight:900, marginTop:'0.15rem', color:col }}>{pct}% {label}</p>
                    </div>
                  );
                })()}
              </div>
              <div style={{ width:'100%', height:'210px', position:'relative' }}>
                {trmChartData
                  ? <Line data={trmChartData} options={chartOpts} />
                  : cargando
                    ? <div className="skeleton" style={{ width:'100%', height:'100%', borderRadius:'var(--radius-md)' }} />
                    : <EmptyState text="Sin datos TRM históricos. Extrae datos para ver la proyección." />
                }
              </div>
            </div>

          </main>

          <aside style={{
            display:'flex', flexDirection:'column', overflow:'hidden',
            background:'var(--bg-sidebar)', border:'1px solid var(--border)',
            borderRadius:'1.5rem', backdropFilter:'var(--blur)',
          }}>
            {/* Tabs + filters */}
            <div style={{ padding:'0.85rem 0.85rem 0 0.85rem', flexShrink:0 }}>
              <div className="tab-group" style={{ marginBottom:'0.65rem' }}>
                {['noticias','mercado'].map(t => (
                  <button key={t} onClick={() => setTabActiva(t)} className={`tab-btn${tabActiva === t ? ' active' : ''}`}>
                    {t === 'noticias' ? 'Noticias' : 'Mercado'}
                  </button>
                ))}
              </div>
              {tabActiva === 'noticias' && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem', paddingBottom:'0.65rem' }}>
                  {fuentes.map(f => (
                    <button key={f} onClick={() => setFuenteSeleccionada(f)} className={`chip${fuenteSeleccionada === f ? ' active' : ''}`}>{f}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Scrollable list */}
            <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:'0.35rem 0.85rem 0.85rem' }}>
              {tabActiva === 'noticias' ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.45rem' }}>
                  {noticiasFiltradas.length > 0
                    ? noticiasFiltradas.map((n, i) => (
                      /* News card with clear "click" affordance */
                      <motion.div
                        key={i}
                        whileHover={{ x: 3 }}
                        transition={{ duration: 0.18 }}
                        className="news-card"
                        onClick={() => n.url && window.open(n.url, '_blank')}
                        style={{ cursor: n.url ? 'pointer' : 'default' }}
                      >
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <span className="news-source">{n.fuente}</span>
                          <span className={n.sentimiento === 'POS' ? 'sent-pos' : n.sentimiento === 'NEG' ? 'sent-neg' : 'sent-neu'} />
                        </div>
                        <p className="news-title">{n.titulo}</p>
                        {/* Clickable affordance — only if URL exists */}
                        {n.url && (
                          <div style={{
                            display:'flex', alignItems:'center', gap:'0.3rem', marginTop:'0.15rem',
                            fontSize:'0.58rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
                            color:'var(--blue)', opacity:0.75,
                          }}>
                            <ExternalLink size={10} /> Ver noticia
                          </div>
                        )}
                      </motion.div>
                    ))
                    : <EmptyState text={cargando ? 'Cargando…' : 'Sin noticias. Presiona Sincronizar.'} />
                  }
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.45rem' }}>
                  {mercadoHistorico.length > 0
                    ? mercadoHistorico.map((m, i) => (
                      <div key={i} className="market-row">
                        <div style={{ display:'flex', alignItems:'center', gap:'0.7rem' }}>
                          <div style={{
                            width:'2.3rem', height:'2.3rem', borderRadius:'0.65rem',
                            background:'var(--blue-dim)', border:'1px solid var(--blue-border)',
                            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0,
                          }}>
                            <span style={{ color:'var(--blue)', fontSize:'0.82rem', fontWeight:900, lineHeight:1 }}>{new Date(String(m.fecha).slice(0,10)+'T12:00:00').getDate()}</span>
                            <span className="label" style={{ fontSize:'0.48rem' }}>{new Date(String(m.fecha).slice(0,10)+'T12:00:00').toLocaleDateString('es-CO',{month:'short'})}</span>
                          </div>
                          <span style={{ fontSize:'0.83rem', fontWeight:700, color:'var(--text-1)' }}>
                            ${m.valor.toLocaleString('es-CO')}
                          </span>
                        </div>
                        <TrendingUp size={13} style={{ color:'var(--text-3)' }} />
                      </div>
                    ))
                    : <EmptyState text={cargando ? 'Cargando…' : 'Sin datos de mercado.'} />
                  }
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
