import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CardPrediccion = ({ titulo, valor, tendencia, confianza, icono: Icono }) => {
  const esAlza = tendencia === 'sube';
  const esBaja = tendencia === 'baja';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass p-6 flex flex-col gap-4"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-secondary text-sm font-semibold uppercase tracking-wider">{titulo}</p>
          <h2 className="text-3xl font-bold mt-1">{valor}</h2>
        </div>
        <div className="p-3 bg-white/5 rounded-2xl">
          <Icono size={20} className="text-blue-400" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
          esAlza ? 'bg-green-500/10 text-green-400' : 
          esBaja ? 'bg-red-500/10 text-red-400' : 
          'bg-slate-500/10 text-slate-400'
        }`}>
          {esAlza && <TrendingUp size={16} />}
          {esBaja && <TrendingDown size={16} />}
          {!esAlza && !esBaja && <Minus size={16} />}
          <span className="capitalize">{tendencia}</span>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex justify-between text-xs text-secondary mb-1">
          <span>Confianza del modelo</span>
          <span className="font-bold text-white">{confianza}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${confianza}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-blue-500"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default CardPrediccion;
