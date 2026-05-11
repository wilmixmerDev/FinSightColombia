import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Cpu, Activity, CheckCircle, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LaunchPage = () => {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  const mockLogs = [
    "Iniciando motores de IA...",
    "Conectando con Portafolio.co...",
    "Capturando noticias de economía...",
    "Analizando sentimiento con Transformers...",
    "Calculando índices de mercado...",
    "Actualizando pesos del modelo predictivo...",
    "Generando proyección de TRM..."
  ];

  const startScraping = async () => {
    setRunning(true);
    // Llamada real al backend
    fetch('http://localhost:8000/scraper/ejecutar', { method: 'POST' });

    // Simulación visual de logs mientras el backend trabaja
    for (let i = 0; i < mockLogs.length; i++) {
      await new Promise(r => setTimeout(r, 1200));
      setLogs(prev => [...prev, mockLogs[i]]);
    }
    
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl"
      >
        <div className="flex justify-center gap-4 mb-6">
          <Activity className="text-blue-400" size={40} />
          <Cpu className="text-blue-400" size={40} />
        </div>
        
        <h1 className="text-4xl font-bold mb-4">¿Todo listo para proyectar el mercado?</h1>
        <p className="text-secondary text-lg mb-8">
          Nuestra inteligencia artificial ha sido entrenada con miles de noticias históricas. 
          Al presionar el botón, iniciaremos un raspado en tiempo real para generar la predicción de hoy.
        </p>

        {!running ? (
          <button 
            onClick={startScraping}
            className="group relative flex items-center justify-center gap-3 bg-white text-dark px-10 py-4 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            style={{ color: '#020617' }}
          >
            <Play fill="currentColor" /> INICIAR ANÁLISIS
          </button>
        ) : (
          <div className="w-full max-w-xl bg-black/40 border border-white-5 rounded-2xl p-6 font-mono text-left text-sm overflow-hidden">
            <div className="flex items-center gap-2 mb-4 border-bottom border-white-5 pb-2 text-blue-400">
              <Terminal size={16} /> CONSOLA DE INTELIGENCIA
            </div>
            <div className="flex flex-col gap-2 h-48 overflow-y-auto">
              <AnimatePresence>
                {logs.map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-blue-500 opacity-50">[{new Date().toLocaleTimeString()}]</span>
                    <span>{log}</span>
                    {i === logs.length - 1 && <motion.span animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity }}>_</motion.span>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LaunchPage;
