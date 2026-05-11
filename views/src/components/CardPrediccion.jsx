import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ShieldCheck } from 'lucide-react';

const CardPrediccion = ({ titulo, valor, tendencia, confianza, icono: Icono }) => {
  const esAlza = tendencia === 'sube';
  const esBaja = tendencia === 'baja';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass p-8 flex flex-col gap-6 relative overflow-hidden group shadow-2xl"
    >
      <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[80px] opacity-20 transition-all group-hover:opacity-40 ${
        esAlza ? 'bg-green-500' : esBaja ? 'bg-red-500' : 'bg-blue-500'
      }`} />

      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{titulo}</p>
          <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{valor}</h2>
        </div>
        <div className="p-3 bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner">
          <Icono size={24} className="text-blue-400" />
        </div>
      </div>

      <div className="flex items-center gap-3 relative z-10">
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg ${
          esAlza ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
          esBaja ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
        }`}>
          {esAlza && <TrendingUp size={14} />}
          {esBaja && <TrendingDown size={14} />}
          {!esAlza && !esBaja && <Minus size={14} />}
          <span>{tendencia}</span>
        </div>
      </div>

      <div className="mt-2 relative z-10">
        <div className="flex justify-between items-center text-[10px] text-slate-400 mb-2 uppercase font-black tracking-widest">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-blue-500" /> Confianza I.A.
          </span>
          <span className="text-white bg-blue-500/20 px-2 py-0.5 rounded-md">{confianza}%</span>
        </div>
        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 p-[1px]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${confianza}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] ${
              esAlza ? 'bg-green-500' : esBaja ? 'bg-red-500' : 'bg-blue-500'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default CardPrediccion;
