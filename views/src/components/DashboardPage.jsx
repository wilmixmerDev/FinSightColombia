import React, { useState, useEffect, useMemo } from 'react';
import CardPrediccion from './CardPrediccion';
import { 
  DollarSign, RefreshCw, Users, Search, AlertCircle, Play, 
  Filter, TrendingUp, Newspaper, ChevronRight, Activity, 
  Globe, Zap, ArrowUpRight, BarChart3, Clock, Database,
  Settings, LogOut
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_BASE = "http://127.0.0.1:8000";

const DashboardPage = () => {
  const [noticias, setNoticias] = useState([]);
  const [predicciones, setPredicciones] = useState([]);
  const [historialSentimiento, setHistorialSentimiento] = useState([]);
  const [mercadoHistorico, setMercadoHistorico] = useState([]);
  const [fuenteSeleccionada, setFuenteSeleccionada] = useState('Todas');
  const [tabSeleccionada, setTabSeleccionada] = useState('noticias');
  const [cargando, setCargando] = useState(false);
  const [ejecutandoScraper, setEjecutandoScraper] = useState(false);
  const navigate = useNavigate();
  const esAdmin = localStorage.getItem('rol') === 'admin';
  const usuario = localStorage.getItem('user') || 'Analista';

  const fuentes = ['Todas', 'Portafolio', 'La República', 'El Tiempo', 'Semana', 'Dinero'];

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const resNoticias = await fetch(`${API_BASE}/noticias/?limit=30`);
      const dataNoticias = await resNoticias.json();
      setNoticias(Array.isArray(dataNoticias) ? dataNoticias : []);

      const resPred = await fetch(`${API_BASE}/prediccion/actual`);
      const dataPred = await resPred.json();
      setPredicciones(Array.isArray(dataPred) ? dataPred : []);

      const resHist = await fetch(`${API_BASE}/noticias/sentimiento-historial?tema=TRM`);
      const dataHist = await resHist.json();
      setHistorialSentimiento(Array.isArray(dataHist) ? dataHist : []);

      const resMercado = await fetch(`${API_BASE}/mercado/historico?variable=TRM&limit=15`);
      const dataMercado = await resMercado.json();
      setMercadoHistorico(Array.isArray(dataMercado) ? dataMercado : []);
      
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setCargando(false), 800);
    }
  };

  const iniciarScraping = async () => {
    setEjecutandoScraper(true);
    try {
      await fetch(`${API_BASE}/scraper/ejecutar`, { method: 'POST' });
      setTimeout(cargarDatos, 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setEjecutandoScraper(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const noticiasFiltradas = useMemo(() => {
    if (fuenteSeleccionada === 'Todas') return noticias;
    return noticias.filter(n => n.fuente === fuenteSeleccionada);
  }, [noticias, fuenteSeleccionada]);

  const chartData = {
    labels: historialSentimiento.length > 0 
      ? historialSentimiento.map(h => new Date(h.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })) 
      : ['01 May', '05 May', '10 May', '15 May', '20 May'],
    datasets: [{
      label: 'Sentimiento TRM',
      data: historialSentimiento.length > 0 ? historialSentimiento.map(h => h.indice) : [0.1, 0.3, -0.2, 0.4, 0.2],
      borderColor: '#3b82f6',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#020617',
      pointBorderWidth: 2,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 15,
        titleFont: { size: 14, weight: 'bold', family: 'Outfit' },
        bodyFont: { size: 13, family: 'Outfit' },
        cornerRadius: 12,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: { min: -1, max: 1, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 overflow-hidden font-['Outfit']">
      <aside className="w-20 lg:w-64 border-r border-white/5 bg-slate-900/20 flex flex-col items-center lg:items-stretch p-6 gap-10">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Zap size={24} className="text-white fill-white" />
          </div>
          <h1 className="hidden lg:block text-xl font-black tracking-tighter">FINSIGHT</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-4">
          <button className="flex items-center gap-4 p-3 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20 font-bold">
            <BarChart3 size={20} />
            <span className="hidden lg:block">Dashboard</span>
          </button>
          <button className="flex items-center gap-4 p-3 text-slate-500 hover:text-slate-300 font-bold">
            <Newspaper size={20} />
            <span className="hidden lg:block">Noticias</span>
          </button>
          <button className="flex items-center gap-4 p-3 text-slate-500 hover:text-slate-300 font-bold">
            <Database size={20} />
            <span className="hidden lg:block">Mercados</span>
          </button>
          {esAdmin && (
            <button onClick={() => navigate('/usuarios')} className="flex items-center gap-4 p-3 text-slate-500 hover:text-slate-300 font-bold">
              <Users size={20} />
              <span className="hidden lg:block">Equipo</span>
            </button>
          )}
        </nav>

        <div className="flex flex-col gap-4">
          <div className="hidden lg:flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 border border-white/10 uppercase">
              {usuario.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{usuario}</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{esAdmin ? 'Admin' : 'Analista'}</p>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="flex items-center gap-4 p-3 text-red-500/60 hover:text-red-500 font-bold">
            <LogOut size={20} />
            <span className="hidden lg:block">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-slate-900/10 backdrop-blur-xl z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock size={16} />
              <span className="text-xs font-black uppercase tracking-widest">
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
            <div className="h-4 w-px bg-white/5"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Online</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input 
                type="text" 
                placeholder="Buscar..."
                className="bg-slate-900/50 border border-white/5 rounded-2xl py-2.5 pl-12 pr-6 text-sm focus:border-blue-500/50 outline-none w-64 transition-all"
              />
            </div>
            <button onClick={iniciarScraping} disabled={ejecutandoScraper} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50">
              <RefreshCw size={14} className={ejecutandoScraper ? 'animate-spin' : ''} />
              {ejecutandoScraper ? '...' : 'Sincronizar'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {predicciones.length > 0 ? predicciones.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <CardPrediccion 
                  titulo={p.variable} 
                  valor={`Tendencia: ${p.prediccion.toUpperCase()}`} 
                  tendencia={p.prediccion} 
                  confianza={Math.round(p.confianza * 100)} 
                  icono={DollarSign} 
                />
              </motion.div>
            )) : (
              [1,2,3].map(i => (
                <div key={i} className="glass h-40 animate-pulse bg-white/5 rounded-[2rem]"></div>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="glass p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex-1 border-white/10 bg-slate-900/40">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Sentimiento</h3>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Impacto TRM</p>
                  </div>
                </div>
                <div style={{ height: '400px' }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="glass p-8 rounded-[3rem] shadow-2xl flex flex-col border-white/10 bg-slate-900/40 h-[650px]">
              <div className="flex p-1.5 bg-slate-950 rounded-3xl mb-8 border border-white/5 shadow-inner">
                <button 
                  onClick={() => setTabSeleccionada('noticias')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tabSeleccionada === 'noticias' ? 'bg-slate-800 text-blue-400 shadow-xl border border-white/5' : 'text-slate-500'}`}
                >
                  <Newspaper size={16} /> Noticias
                </button>
                <button 
                  onClick={() => setTabSeleccionada('mercado')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tabSeleccionada === 'mercado' ? 'bg-slate-800 text-blue-400 shadow-xl border border-white/5' : 'text-slate-500'}`}
                >
                  <Activity size={16} /> Mercado
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <AnimatePresence mode="wait">
                  {tabSeleccionada === 'noticias' ? (
                    <motion.div key="noticias" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-950/50 rounded-2xl border border-white/5">
                        {fuentes.slice(0, 4).map(f => (
                          <button key={f} onClick={() => setFuenteSeleccionada(f)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${fuenteSeleccionada === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>
                            {f}
                          </button>
                        ))}
                      </div>
                      
                      {noticiasFiltradas.map((n, i) => (
                        <div key={i} className="group relative p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-[2rem] border border-white/5 transition-all cursor-pointer" onClick={() => window.open(n.url, '_blank')}>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-widest">{n.fuente}</span>
                            <span className="text-[9px] font-bold text-slate-600">{new Date(n.fecha).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors leading-relaxed line-clamp-2 mb-3">{n.titulo}</p>
                          <div className="flex items-center gap-2 text-[9px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                            Ver más <ArrowUpRight size={14} />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div key="mercado" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <div className="p-6 bg-blue-600/10 rounded-[2rem] border border-blue-500/20 mb-6">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Monitor TRM</p>
                        <h4 className="text-3xl font-black text-white tracking-tighter">${mercadoHistorico[0]?.valor.toLocaleString() || '3,850'}</h4>
                      </div>

                      {mercadoHistorico.map((m, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-900/40 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-4">
                            <Database size={18} className="text-slate-500" />
                            <div>
                              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{new Date(m.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</p>
                              <p className="text-sm font-bold text-slate-300">${m.valor.toLocaleString()}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-800" />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

export default DashboardPage;
