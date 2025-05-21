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

// Servicio para contenido multimedia
export const contenidoService = {
  // Subir archivo al servidor
  async upload(file, postId) {
    const user = authService.getCurrentUser();
    
    if (!user) {
      return Promise.reject('Usuario no autenticado');
    }
    
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('postId', postId);
    
    const response = await fetch(`${API_URL}/contenido/subir`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      body: formData
    });
    
    return handleResponse(response);
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

// Este servicio lo usaremos más adelante para integrarlo con Firebase Storage
export const storageService = {
  // Subir archivo a Firebase Storage
  async uploadFile(file) {
    // Aquí irá la lógica para subir a Firebase
    // Por ahora devolvemos una URL simulada
    return {
      url: URL.createObjectURL(file),
      fileName: file.name
    };
  }
};