import React, { useState } from 'react';
import { UserPlus, Mail, Lock, ChevronLeft, User, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function UserManagement() {
  const [nombre,   setNombre]   = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [rol,      setRol]      = useState('user');
  const [msg,      setMsg]      = useState('');
  const navigate = useNavigate();

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/auth/crear-usuario?nombre=${nombre}&email=${email}&password=${password}&rol=${rol}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setMsg('Usuario creado correctamente');
        setNombre(''); setEmail(''); setPassword('');
        setTimeout(() => setMsg(''), 3000);
      } else {
        const error = await res.json();
        setMsg(`Error: ${error.detail}`);
      }
    } catch { setMsg('Error de conexión'); }
  };

  const isError = msg.startsWith('Error');

  return (
    <div className="app-shell" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
    }}>
      <div style={{ width: '100%', maxWidth: '580px' }}>

        <button
          onClick={() => navigate('/dashboard')}
          className="btn-ghost"
          style={{ marginBottom: '1.25rem' }}
        >
          <ChevronLeft size={17} /> Volver al Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ padding: '2.25rem' }}
        >
          {/* Card header */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="logo-icon" style={{ width: '3rem', height: '3rem', borderRadius: '0.85rem' }}>
                <UserPlus size={20} />
              </div>
              <div>
                <span className="pill" style={{ display: 'inline-flex', marginBottom: '0.5rem' }}>
                  <Sparkles size={10} /> Administración
                </span>
                <h2 style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                }}>
                  Crear usuario
                </h2>
              </div>
            </div>

            <div style={{
              padding: '0.6rem 0.9rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'right',
              flexShrink: 0,
            }}>
              <p className="label">Control de acceso</p>
              <p style={{ marginTop: '0.2rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)' }}>Panel interno</p>
            </div>
          </div>

          {/* Alert */}
          {msg && (
            <div className={isError ? 'alert-error' : 'alert-success'} style={{ marginBottom: '1.5rem' }}>
              {msg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Nombre */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre completo</label>
              <div className="relative">
                <User size={15} className="input-icon" />
                <input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="fs-input"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Correo electrónico</label>
              <div className="relative">
                <Mail size={15} className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="fs-input"
                  placeholder="correo@empresa.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Contraseña</label>
              <div className="relative">
                <Lock size={15} className="input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="fs-input"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Rol</label>
              <div className="relative">
                <Shield size={15} className="input-icon" />
                <select
                  value={rol}
                  onChange={e => setRol(e.target.value)}
                  className="fs-select"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '1rem' }}>
              <UserPlus size={16} /> Crear usuario
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
