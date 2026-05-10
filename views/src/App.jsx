import React, { useState, useEffect } from 'react';
import CardPrediccion from './components/CardPrediccion';
import { DollarSign, Percent, Landmark, RefreshCw } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const API_BASE = 'http://localhost:8000';

function App() {
  const [predicciones, setPredicciones] = useState({});
  const [noticias, setNoticias] = useState([]);
  const [historico, setHistorico] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
    // Actualizar cada 60 segundos
    const intervalo = setInterval(cargarDatos, 60000);
    return () => clearInterval(intervalo);
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar predicciones
      const predTRM = await fetch(`${API_BASE}/prediccion/hoy?variable=TRM`).then(r => r.json());
      const predInflacion = await fetch(`${API_BASE}/prediccion/hoy?variable=Inflacion`).then(r => r.json());
      const predTasas = await fetch(`${API_BASE}/prediccion/hoy?variable=Tasas`).then(r => r.json());
      
      setPredicciones({
        TRM: predTRM,
        Inflacion: predInflacion,
        Tasas: predTasas
      });

      // Cargar noticias recientes
      const noticiasRes = await fetch(`${API_BASE}/noticias/recientes?limite=5`).then(r => r.json());
      setNoticias(noticiasRes.noticias || []);

      // Cargar datos históricos para gráfico
      const histTRM = await fetch(`${API_BASE}/mercado/historico?variable=TRM&dias=30`).then(r => r.json());
      setHistorico(histTRM);

      setCargando(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setCargando(false);
    }
  };

  const generarChartData = () => {
    if (!historico.datos || historico.datos.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const datos = historico.datos.slice(-30);
    const labels = datos.map(d => d.fecha.split('-')[2]);
    
    return {
      labels,
      datasets: [
        {
          fill: true,
          label: 'TRM',
          data: datos.map(d => d.valor),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          tension: 0.4,
        }
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { family: 'Outfit' } }
      },
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  const getTendenciaIcon = (variable) => {
    const map = {
      'TRM': DollarSign,
      'Inflacion': Percent,
      'Tasas': Landmark
    };
    return map[variable] || DollarSign;
  };

  if (cargando) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p className="text-secondary">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <header className="flex justify-between items-center mb-1" style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, background: 'linear-gradient(to right, #fff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FinSight Colombia
          </h1>
          <p className="text-secondary text-sm">IA para predicción de indicadores financieros</p>
        </div>
        <div className="text-secondary text-sm" style={{ textAlign: 'right' }}>
          <p>{new Date().toLocaleDateString('es-CO')}</p>
          <p className="flex items-center gap-1 justify-end cursor-pointer" onClick={cargarDatos}>
            <RefreshCw size={12} /> Actualizar datos
          </p>
        </div>
      </header>

      <main>
        {/* Predicciones */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {Object.entries(predicciones).map(([variable, pred]) => (
            !pred.error && (
              <CardPrediccion 
                key={variable}
                titulo={variable === 'Inflacion' ? 'Inflación (IPC)' : variable === 'Tasas' ? 'Tasas BanRep' : 'TRM (Dólar)'} 
                valor={pred.valor_actual ? `${pred.valor_actual}` : '...'}
                tendencia={pred.prediccion}
                confianza={pred.confianza}
                icono={getTendenciaIcon(variable)}
              />
            )
          ))}
        </div>

        {/* Gráfico y Noticias */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div className="glass p-6">
            <h3 className="mb-1">Histórico TRM (30 días)</h3>
            <Line data={generarChartData()} options={chartOptions} />
          </div>

          <div className="glass p-6">
            <h3 className="mb-1 flex justify-between">
              Noticias Recientes
              <span className="text-secondary" style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>Últimas: {noticias.length}</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {noticias.length > 0 ? (
                noticias.map((noticia, i) => (
                  <NewsItem 
                    key={i}
                    source={noticia.fuente} 
                    title={noticia.titulo} 
                    sentiment={noticia.sentimiento === 'POS' ? 'positive' : noticia.sentimiento === 'NEG' ? 'negative' : 'neutral'} 
                  />
                ))
              ) : (
                <p className="text-secondary text-sm">No hay noticias disponibles</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NewsItem({ source, title, sentiment }) {
  const color = sentiment === 'positive' ? '#4ade80' : sentiment === 'negative' ? '#fb7185' : '#94a3b8';
  return (
    <div style={{ padding: '0.8rem 0', borderBottom: '1px solid var(--border-glass)' }}>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{source}</span>
      </div>
      <div className="text-sm font-semibold flex items-start gap-2">
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, marginTop: '5px', flexShrink: 0 }}></span>
        <span>{title}</span>
      </div>
    </div>
  );
}

export default App;
