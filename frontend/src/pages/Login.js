import React, { useState } from 'react';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validación simple
    if (!username || !password) {
      setError('Todos los campos son obligatorios');
      return;
    }
    
    try {
      setLoading(true);
      
      // Login con el servidor principal
      const userData = await authService.login(username, password);
      
      // Obtener el token de Firebase inmediatamente después del login
      await authService.getFirebaseToken();
      
      // Login exitoso, redirigir a home
      navigate('/');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al iniciar sesión');
      console.error('Error en login:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Iniciar Sesión</h1>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border rounded w-full p-2"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded w-full p-2"
          />
        </div>
        
        <button 
          type="submit" 
          className="bg-primary hover:bg-red-800 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>
      
      <div className="mt-4">
        <p>¿No tienes una cuenta? <a href="/register" className="text-primary hover:underline">Registrarse</a></p>
        <p>Olvidaste la contraseña? <a href="/register" className="text-primary hover:underline">ingresa aqui</a></p>
      </div>
    </div>
  );
}

export default Login;