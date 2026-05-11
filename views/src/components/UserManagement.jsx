import React, { useState } from 'react';
import { UserPlus, Shield, Mail, Lock, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('user');
  const navigate = useNavigate();

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/auth/crear-usuario?nombre=${nombre}&email=${email}&password=${password}&rol=${rol}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert('Usuario creado exitosamente');
        setNombre(''); setEmail(''); setPassword('');
      } else {
        const error = await res.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-secondary hover:text-white mb-8 transition-all">
        <ChevronLeft size={20} /> Volver al Dashboard
      </button>

      <div className="glass p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-500 rounded-2xl">
            <UserPlus size={24} color="white" />
          </div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        </div>

        <form onSubmit={handleCreateUser} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-secondary px-1">Nombre Completo</label>
            <input 
              className="bg-white-5 border border-white-5 rounded-2xl p-3 outline-none focus:border-blue-400 text-white"
              value={nombre} onChange={e => setNombre(e.target.value)} required 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-secondary px-1">Email</label>
            <div className="flex items-center bg-white-5 rounded-2xl px-3 border border-white-5">
              <Mail size={18} className="text-secondary mr-2" />
              <input 
                type="email" className="bg-transparent py-3 border-none outline-none text-white w-full"
                value={email} onChange={e => setEmail(e.target.value)} required 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-secondary px-1">Contraseña</label>
            <div className="flex items-center bg-white-5 rounded-2xl px-3 border border-white-5">
              <Lock size={18} className="text-secondary mr-2" />
              <input 
                type="password" className="bg-transparent py-3 border-none outline-none text-white w-full"
                value={password} onChange={e => setPassword(e.target.value)} required 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-secondary px-1">Rol del Usuario</label>
            <select 
              className="bg-white-5 border border-white-5 rounded-2xl p-3 outline-none text-white appearance-none"
              style={{ backgroundColor: 'var(--bg-dark)' }}
              value={rol} onChange={e => setRol(e.target.value)}
            >
              <option value="user">Usuario (Solo consulta)</option>
              <option value="admin">Administrador (Control total)</option>
            </select>
          </div>

          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl mt-4 transition-all">
            Registrar Nuevo Usuario
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;
