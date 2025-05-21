// api.js
import  { firebaseStorageService }  from '../services/firebaseStorage'; // Asegúrate de que la ruta sea correcta


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
  
  // Cerrar sesión
  logout() {
    localStorage.removeItem('user');
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
      // 1. Primero obtener token de Firebase desde tu backend
      const firebaseTokenResponse = await fetch(`${API_URL}/auth/firebase-token`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      const { firebaseToken } = await handleResponse(firebaseTokenResponse);
      
      // 2. Autenticar con Firebase
      await firebaseStorageService.authenticateWithFirebase(firebaseToken);
      
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

// Servicio de almacenamiento - ACTUALIZADO
export const storageService = {
  // Subir archivo a Firebase Storage (interfaz simplificada)
  async uploadFile(file, userId, postId, onProgress = null) {
    return firebaseStorageService.uploadFile(file, userId, postId, onProgress);
  },
  
  // Eliminar archivo de Firebase Storage
  async deleteFile(filePath) {
    return firebaseStorageService.deleteFile(filePath);
  }
};