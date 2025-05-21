// api.js
// api.js
import { firebaseStorageService } from '../services/firebaseStorage'; // Asegúrate de que la ruta sea correcta

const API_URL = 'http://localhost:5000/api';

// Función para manejar errores de fetch
const handleResponse = async (response) => {
  const text = await response.text();
  const data = text && JSON.parse(text);
  
  if (!response.ok) {
    const error = (data && data.error) || response.statusText;
    return Promise.reject(error);
  }
  
  return data;
};

// Servicio de autenticación
export const authService = {
  // Registro de usuario
  async register(username, email, password) {
    const response = await fetch(`${API_URL}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    return handleResponse(response);
  },
  
  // Login de usuario
  async login(username, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await handleResponse(response);
    
    // Guardar token en localStorage
    if (data.token) {
      localStorage.setItem('user', JSON.stringify({
        token: data.token,
        ...data.usuario
      }));
    }
    
    return data;
  },
  
  // Obtener token de Firebase
  
  async getFirebaseToken() {
    try {
      const user = this.getCurrentUser();
      console.log('Current user:', user); // ← NUEVO LOG
      
      if (!user) {
        return Promise.reject('Usuario no autenticado');
      }
      
      console.log('Making request to:', `${API_URL}/auth/firebase-token`); // ← NUEVO LOG
      console.log('With token:', user.token); // ← NUEVO LOG
      
      // Solicitar token de Firebase al backend
      const response = await fetch(`${API_URL}/auth/firebase-token`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      console.log('Response status:', response.status); // ← NUEVO LOG
      console.log('Response headers:', response.headers); // ← NUEVO LOG
      
      const data = await handleResponse(response);
      console.log('Final processed data:', data); // ← NUEVO LOG
      
      if (data && data.firebaseToken) {
        console.log('Firebase token found:', data.firebaseToken); // ← NUEVO LOG
        
        // Guardar token de Firebase en localStorage
        const updatedUser = {
          ...user,
          firebaseToken: data.firebaseToken,
          firebaseTokenExpiry: Date.now() + 3600000 // Expira en 1 hora
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Autenticar con Firebase inmediatamente
        await firebaseStorageService.authenticateWithFirebase(data.firebaseToken);
        
        return data.firebaseToken;
      } else {
        console.error('No firebaseToken in response. Data received:', data); // ← NUEVO LOG
        throw new Error('No se pudo obtener el token de Firebase');
      }
    } catch (error) {
      console.error('Error obteniendo token de Firebase:', error);
      throw error;
    }
  },
  
  // Verificar si el token de Firebase es válido
  isFirebaseTokenValid() {
    const user = this.getCurrentUser();
    
    if (!user || !user.firebaseToken || !user.firebaseTokenExpiry) {
      return false;
    }
    
    // Verificar si ha expirado (con un margen de 5 minutos para renovarlo antes)
    return user.firebaseTokenExpiry > (Date.now() + 300000);
  },
  
  // Obtener token de Firebase, renovándolo si es necesario
  async ensureFirebaseToken() {
    if (!this.isFirebaseTokenValid()) {
      return await this.getFirebaseToken();
    }
    
    const user = this.getCurrentUser();
    return user.firebaseToken;
  },
  
  // Cerrar sesión
  logout() {
    localStorage.removeItem('user');
    // Intentar cerrar sesión en Firebase también
    try {
      firebaseStorageService.signOut();
    } catch (error) {
      console.warn('Error al cerrar sesión en Firebase:', error);
    }
  },
  
  // Obtener usuario actual
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  }
};

// Servicio para posts
export const postService = {
  // Obtener todos los posts del usuario
  async getAll() {
    const user = authService.getCurrentUser();
    
    if (!user) {
      return Promise.reject('Usuario no autenticado');
    }
    
    const response = await fetch(`${API_URL}/posts/usuario`, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    return handleResponse(response);
  },
  
  // Crear un nuevo post
  async create(titulo, descripcion) {
    const user = authService.getCurrentUser();
    
    if (!user) {
      return Promise.reject('Usuario no autenticado');
    }
    
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ titulo, descripcion })
    });
    
    return handleResponse(response);
  },
  
  // Obtener un post específico
  async getById(id) {
    const user = authService.getCurrentUser();
    
    if (!user) {
      return Promise.reject('Usuario no autenticado');
    }
    
    const response = await fetch(`${API_URL}/posts/${id}`, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    return handleResponse(response);
  },
  
  // Eliminar un post
  async delete(id) {
    const user = authService.getCurrentUser();
    
    if (!user) {
      return Promise.reject('Usuario no autenticado');
    }
    
    const response = await fetch(`${API_URL}/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    return handleResponse(response);
  }
};

export const contenidoService = {
  // Subir archivo usando Firebase Storage
  async upload(file, postId, onProgress = null) {
    const user = authService.getCurrentUser();
    
    if (!user) {
      return Promise.reject('Usuario no autenticado');
    }

    try {
      // 1. Asegurarse de tener un token válido de Firebase
      const firebaseToken = await authService.ensureFirebaseToken();
      
      // 2. Verificar autenticación con Firebase (si es necesario)
      if (!firebaseStorageService.isAuthenticated()) {
        await firebaseStorageService.authenticateWithFirebase(firebaseToken);
      }
      
      // 3. Subir archivo a Firebase Storage
      const uploadResult = await firebaseStorageService.uploadFile(
        file, 
        user.id, 
        postId, 
        onProgress
      );
      
      // 4. Guardar información en tu base de datos
      const contenidoData = {
        postId,
        tipo: file.type.startsWith('video/') ? 'video' : 'imagen',
        url: uploadResult.url,
        nombreArchivo: uploadResult.originalName,
        tamano: uploadResult.size,
        firebase_path: `posts/${user.id}/${postId}/${uploadResult.fileName}`
      };
      
      const response = await fetch(`${API_URL}/contenido/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(contenidoData)
      });
      
      return handleResponse(response);
      
    } catch (error) {
      console.error('Error subiendo a Firebase:', error);
      throw error;
    }
  },
  
  // Eliminar un contenido
  async delete(id) {
    const user = authService.getCurrentUser();
    
    if (!user) {
      return Promise.reject('Usuario no autenticado');
    }
    
    const response = await fetch(`${API_URL}/contenido/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    return handleResponse(response);
  }
};

// Servicio de almacenamiento
export const storageService = {
  // Subir archivo a Firebase Storage (interfaz simplificada)
  async uploadFile(file, userId, postId, onProgress = null) {
    // Asegurarse de tener un token válido antes de intentar subir
    await authService.ensureFirebaseToken();
    return firebaseStorageService.uploadFile(file, userId, postId, onProgress);
  },
  
  // Eliminar archivo de Firebase Storage
  async deleteFile(filePath) {
    // Asegurarse de tener un token válido antes de intentar eliminar
    await authService.ensureFirebaseToken();
    return firebaseStorageService.deleteFile(filePath);
  }
};