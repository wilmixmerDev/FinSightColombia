import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, AlertCircle, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const res = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', data.nombre);
        localStorage.setItem('rol', data.rol);
        navigate('/lanzamiento');
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión. Verifica que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse duration-700" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass p-12 w-full max-w-lg shadow-2xl relative z-10 border-white/10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-500/20 mb-6"
          >
            <Zap className="text-white fill-white" size={32} />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            FinSight<span className="text-blue-500">Colombia</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-tight">Acceso Seguro al Terminal de Inteligencia</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 flex items-center gap-3 text-sm font-bold"
          >
            <AlertCircle size={20} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Email Corporativo</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                placeholder="usuario@finsight.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="relative mt-4 group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2 relative z-10">
              {loading ? 'AUTENTICANDO...' : 'ACCEDER AL TERMINAL'} 
              {!loading && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </div>
          </button>
        </form>

        <div className="mt-10 flex items-center justify-center gap-2 text-slate-500">
          <ShieldCheck size={16} className="text-blue-500/50" />
          <p className="text-[10px] font-black uppercase tracking-widest">Encriptación de Grado Bancario Activa</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
