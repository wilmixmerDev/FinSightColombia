import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database } from 'lucide-react';

const API = 'http://127.0.0.1:8000';

export default function NoticiasHistoricas() {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [limit] = useState(50);
  const [fuenteActiva, setFuenteActiva] = useState('Todas');
  const navigate = useNavigate();

  const resumen = useMemo(() => {
    const total = noticias.length;
    const fuentes = new Set(noticias.map((n) => n.fuente).filter(Boolean)).size;
    const positivos = noticias.filter((n) => String(n.sentimiento).toUpperCase() === 'POS').length;
    const negativos = noticias.filter((n) => String(n.sentimiento).toUpperCase() === 'NEG').length;
    return {
      total,
      fuentes,
      positivos,
      negativos,
      neutros: Math.max(total - positivos - negativos, 0),
    };
  }, [noticias]);

  const fuentesAgrupadas = useMemo(() => {
    const grupos = noticias.reduce((acc, noticia) => {
      const key = noticia.fuente || 'Sin fuente';
      if (!acc[key]) acc[key] = [];
      acc[key].push(noticia);
      return acc;
    }, {});

    return Object.entries(grupos).sort((a, b) => b[1].length - a[1].length);
  }, [noticias]);

  const noticiasVisibles = useMemo(() => {
    if (fuenteActiva === 'Todas') return noticias;
    return noticias.filter((noticia) => (noticia.fuente || 'Sin fuente') === fuenteActiva);
  }, [noticias, fuenteActiva]);

  const formatearFecha = (valor) => {
    if (!valor) return 'Sin fecha';
    const fecha = new Date(String(valor).slice(0, 10) + 'T12:00:00');
    return Number.isNaN(fecha.getTime()) ? 'Sin fecha' : fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  useEffect(() => { cargar(); }, []);
  const cargar = async () => {
    setCargando(true);
    try {
      const r = await fetch(`${API}/noticias/historicas?limit=${limit}`);
      const data = await r.json();
      setNoticias(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); setNoticias([]); }
    finally { setCargando(false); }
  };

  return (
    <div style={{ minHeight: '100%', overflowY: 'auto', padding: '1rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gap: '0.9rem' }}>
        <section
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1rem 1.1rem',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.16)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:'0.45rem' }}>
                <Database size={14} /> Archivo consultable
              </span>
            </p>
            <h2 style={{ margin: '0.35rem 0 0', fontFamily: 'var(--font-title)', fontSize: '1.6rem', lineHeight: 1.05 }}>
              Noticias históricas
            </h2>
            <p style={{ margin: '0.45rem 0 0', color: 'var(--text-2)', fontSize: '0.88rem', maxWidth: 720, lineHeight: 1.5 }}>
              Revisión ordenada de los registros etiquetados en la base de datos. El panel separa el resumen general y el listado para que no quede todo pegado hacia abajo.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button onClick={() => navigate(-1)} className="btn-ghost">Volver</button>
            <button onClick={cargar} className="btn-primary">Recargar</button>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.7rem' }}>
          {[
            { label: 'Total', value: resumen.total },
            { label: 'Fuentes', value: resumen.fuentes },
            { label: 'Positivas', value: resumen.positivos },
            { label: 'Negativas', value: resumen.negativos },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '0.85rem 0.95rem',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800 }}>
                {item.label}
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-1)' }}>
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section
          style={{
            padding: '0.9rem',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.018)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', marginBottom: '0.75rem' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
                Secciones
              </p>
              <h3 style={{ margin: '0.25rem 0 0', fontSize: '1rem' }}>
                Elige una fuente para ver su listado
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setFuenteActiva('Todas')}
                className={fuenteActiva === 'Todas' ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '0.4rem 0.75rem' }}
              >
                Todas ({resumen.total})
              </button>
              {fuentesAgrupadas.map(([fuente, items]) => (
                <button
                  key={fuente}
                  onClick={() => setFuenteActiva(fuente)}
                  className={fuenteActiva === fuente ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding: '0.4rem 0.75rem' }}
                >
                  {fuente} ({items.length})
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(260px, 0.55fr)', gap: '0.9rem', alignItems: 'start' }}>
          <section
            style={{
              padding: '0.9rem',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.018)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div>
                <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
                  {fuenteActiva === 'Todas' ? 'Feed principal' : 'Listado filtrado'}
                </p>
                <h3 style={{ margin: '0.25rem 0 0', fontSize: '1rem' }}>
                  {fuenteActiva === 'Todas' ? 'Listado de registros' : fuenteActiva}
                </h3>
              </div>
              <span style={{ color: 'var(--text-3)', fontSize: '0.76rem' }}>
                {noticiasVisibles.length} registros
              </span>
            </div>

            {cargando ? (
              <div className="skeleton" style={{ height: 220, borderRadius: 16 }} />
            ) : noticiasVisibles.length === 0 ? (
              <p style={{ color: 'var(--text-3)', margin: 0 }}>No hay noticias históricas.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {noticiasVisibles.map((n) => (
                  <article
                    key={n.id}
                    className="news-card"
                    onClick={() => n.url && window.open(n.url, '_blank')}
                    style={{
                      padding: '0.8rem',
                      cursor: n.url ? 'pointer' : 'default',
                      borderRadius: 16,
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00))',
                      border: '1px solid rgba(255,255,255,0.04)',
                      display: 'grid',
                      gap: '0.55rem',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.8rem', alignItems: 'start' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                            {n.fuente}
                          </span>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--blue)' }} />
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{formatearFecha(n.fecha)}</span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: '1rem', lineHeight: 1.35, color: 'var(--text-1)' }}>
                          {n.titulo}
                        </h4>
                        {n.resumen && (
                          <p style={{ margin: '0.45rem 0 0', color: 'var(--text-2)', fontSize: '0.86rem', lineHeight: 1.5, maxWidth: 760 }}>
                            {n.resumen}
                          </p>
                        )}
                      </div>

                      <div style={{ textAlign: 'right', minWidth: 110 }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 700 }}>#{n.id}</div>
                        {n.puntaje !== undefined && (
                          <div style={{ marginTop: 4, fontSize: '0.76rem', color: 'var(--text-3)' }}>
                            score {Number(n.puntaje).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.28rem 0.55rem', borderRadius: 999, background: 'rgba(255,255,255,0.04)', color: 'var(--text-1)' }}>
                        {n.sentimiento || 'NEU'}
                      </span>
                      {n.probabilidad_direccion && (
                        <span style={{ fontSize: '0.72rem', padding: '0.28rem 0.55rem', borderRadius: 999, background: 'rgba(79,140,255,0.08)', color: 'var(--blue)' }}>
                          Dirección: {n.probabilidad_direccion}
                        </span>
                      )}
                      {n.url && (
                        <div style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: '0.72rem', fontWeight: 700 }}>
                          Ver original
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside
            style={{
              position: 'sticky',
              top: '1rem',
              padding: '0.9rem',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.018)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
              Cómo usarlo
            </p>
            <h3 style={{ margin: '0.25rem 0 0.55rem', fontSize: '1rem' }}>
              Secciones rápidas
            </h3>
            <div style={{ display: 'grid', gap: '0.55rem' }}>
              <div style={{ padding: '0.75rem 0.8rem', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Paso 1
                </p>
                <p style={{ margin: '0.3rem 0 0', color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Haz clic en una fuente de arriba para ver solo sus noticias.
                </p>
              </div>
              <div style={{ padding: '0.75rem 0.8rem', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Paso 2
                </p>
                <p style={{ margin: '0.3rem 0 0', color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Usa <strong style={{ color: 'var(--text-1)' }}>Todas</strong> si quieres volver al archivo completo.
                </p>
              </div>
              <div style={{ padding: '0.75rem 0.8rem', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Paso 3
                </p>
                <p style={{ margin: '0.3rem 0 0', color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  El botón <strong style={{ color: 'var(--text-1)' }}>Abrir</strong> manda a la noticia original si tiene URL.
                </p>
              </div>
            </div>
          </aside>
        </div>
        </section>
      </div>
    </div>
  );
}
