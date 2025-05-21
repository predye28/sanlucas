import { storage, auth } from '../config/firebase';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { signInWithCustomToken, signOut } from 'firebase/auth';

export const firebaseStorageService = {
  // Verificar si hay un usuario autenticado en Firebase
  isAuthenticated() {
    return !!auth.currentUser;
  },
  
  // Autenticar con Firebase usando tu token personalizado
  async authenticateWithFirebase(customToken) {
    try {
      // Si ya hay una sesión activa, verificar si es válida
      if (auth.currentUser) {
        console.log('Ya hay una sesión activa en Firebase. UID:', auth.currentUser.uid);
        // Verificar si el token aún es válido
        try {
          await auth.currentUser.getIdToken(true); // Forzar renovación
          return true;
        } catch (tokenError) {
          console.log('Token existente inválido, reautenticando...');
          await this.signOut();
        }
      }
      
      console.log('Intentando autenticar con Firebase...');
      console.log('Token length:', customToken.length);
      console.log('Token preview:', customToken.substring(0, 50) + '...');
      
      // Verificar que el token no esté vacío
      if (!customToken || customToken.trim() === '') {
        throw new Error('Token personalizado vacío o inválido');
      }
      
      // Autenticar con el token personalizado
      const userCredential = await signInWithCustomToken(auth, customToken);
      
      // Verificar autenticación
      if (userCredential && userCredential.user) {
        console.log('Autenticación exitosa en Firebase. UID:', userCredential.user.uid);
        
        // Verificar que el usuario puede obtener un token de ID
        const idToken = await userCredential.user.getIdToken();
        console.log('Token de ID obtenido correctamente');
        
        return true;
      }
      
      console.log('Autenticación fallida - no se obtuvo credencial');
      return false;
    } catch (error) {
      console.error('Error detallado al autenticar con Firebase:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Proporcionar mensajes más específicos según el error
      if (error.code === 'auth/configuration-not-found') {
        throw new Error('Configuración de Firebase no encontrada. Verifica tu archivo de configuración.');
      } else if (error.code === 'auth/invalid-custom-token') {
        throw new Error('Token personalizado inválido. Verifica la generación del token en el backend.');
      } else if (error.code === 'auth/custom-token-mismatch') {
        throw new Error('El token personalizado no coincide con el proyecto de Firebase.');
      }
      
      throw error;
    }
  },

  // Cerrar sesión en Firebase
  async signOut() {
    try {
      if (auth.currentUser) {
        await signOut(auth);
        console.log('Sesión cerrada en Firebase');
      }
    } catch (error) {
      console.error('Error cerrando sesión en Firebase:', error);
    }
  },

  // Subir archivo a Firebase Storage
  async uploadFile(file, userId, postId, onProgress = null) {
    try {
      // Verificar autenticación
      if (!auth.currentUser) {
        throw new Error('No hay usuario autenticado en Firebase');
      }
      
      console.log('Usuario autenticado en Firebase:', auth.currentUser.uid);
      
      // Verificar que el archivo sea válido
      if (!file || !file.name) {
        throw new Error('Archivo inválido o sin nombre');
      }
      
      // Verificar tamaño del archivo (ejemplo: máximo 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Máximo 100MB permitido.');
      }
      
      // Convertir IDs a string
      const userIdStr = userId.toString();
      const postIdStr = postId.toString();
      
      // Nombre y ruta del archivo
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `posts/${userIdStr}/${postIdStr}/${fileName}`;
      
      console.log('Subiendo archivo a ruta:', filePath);
      console.log('Tamaño del archivo:', file.size, 'bytes');
      console.log('Tipo de archivo:', file.type);
      
      // Crear referencia y subir
      const fileRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(fileRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Progreso de subida: ${progress.toFixed(2)}%`);
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            console.error('Error en la subida:', {
              code: error.code,
              message: error.message,
              serverResponse: error.serverResponse
            });
            
            // Proporcionar mensajes más específicos
            if (error.code === 'storage/unauthorized') {
              reject(new Error('No tienes permisos para subir archivos. Verifica tu autenticación.'));
            } else if (error.code === 'storage/canceled') {
              reject(new Error('Subida cancelada por el usuario.'));
            } else if (error.code === 'storage/quota-exceeded') {
              reject(new Error('Cuota de almacenamiento excedida.'));
            } else {
              reject(new Error(`Error subiendo archivo: ${error.message}`));
            }
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Archivo subido exitosamente a:', filePath);
              console.log('URL de descarga:', downloadURL);
              
              resolve({
                url: downloadURL,
                fileName,
                originalName: file.name,
                size: file.size,
                type: file.type,
                filePath
              });
            } catch (error) {
              console.error('Error obteniendo URL de descarga:', error);
              reject(new Error('Error obteniendo URL de descarga del archivo'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Error preparando la subida:', error);
      throw error;
    }
  },

  // Eliminar archivo de Firebase Storage
  async deleteFile(filePath) {
    try {
      // Verificar autenticación
      if (!auth.currentUser) {
        throw new Error('No hay usuario autenticado en Firebase');
      }
      
      console.log('Eliminando archivo:', filePath);
      
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      
      console.log('Archivo eliminado exitosamente:', filePath);
      return true;
    } catch (error) {
      console.error('Error eliminando archivo:', {
        code: error.code,
        message: error.message,
        filePath
      });
      
      if (error.code === 'storage/object-not-found') {
        console.warn('Archivo no encontrado, posiblemente ya fue eliminado');
        return true; // Considerar como éxito si el archivo ya no existe
      }
      
      return false;
    }
  },

  // Extraer la ruta del archivo desde la URL de descarga
  extractFilePathFromUrl(downloadUrl) {
    try {
      const url = new URL(downloadUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        console.log('Ruta extraída:', filePath);
        return filePath;
      }
      return null;
    } catch (error) {
      console.error('Error extrayendo ruta del archivo:', error);
      return null;
    }
  },

  // Verificar conectividad con Firebase
  async testConnection() {
    try {
      if (!auth.currentUser) {
        return { connected: false, error: 'No hay usuario autenticado' };
      }
      
      // Intentar obtener un token de ID para verificar conectividad
      await auth.currentUser.getIdToken(true);
      return { connected: true };
    } catch (error) {
      return { 
        connected: false, 
        error: error.message,
        code: error.code 
      };
    }
  }
};