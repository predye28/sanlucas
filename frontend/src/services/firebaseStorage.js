// src/services/firebaseStorage.js
import { storage, auth } from '../config/firebase';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { signInWithCustomToken } from 'firebase/auth';

export const firebaseStorageService = {
  // Autenticar con Firebase usando tu token personalizado
  async authenticateWithFirebase(customToken) {
    try {
      // Cerrar sesión previa si existe
      if (auth.currentUser) {
        console.log('Cerrando sesión previa en Firebase');
        await auth.signOut();
      }
      
      console.log('Intentando autenticar con Firebase...');
      
      // Autenticar con el token personalizado
      const userCredential = await signInWithCustomToken(auth, customToken);
      
      // Verificar autenticación
      if (userCredential && userCredential.user) {
        console.log('Autenticación exitosa en Firebase. UID:', userCredential.user.uid);
        
        // Obtener el token ID para verificar los claims
        const idToken = await userCredential.user.getIdToken();
        console.log('Token ID obtenido correctamente');
        
        return true;
      }
      
      console.log('Autenticación fallida - no se obtuvo credencial');
      return false;
    } catch (error) {
      console.error('Error al autenticar con Firebase:', error);
      throw error;
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
      
      // Convertir IDs a string
      const userIdStr = userId.toString();
      const postIdStr = postId.toString();
      
      // Nombre y ruta del archivo
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `posts/${userIdStr}/${postIdStr}/${fileName}`;
      
      console.log('Subiendo archivo a ruta:', filePath);
      
      // Crear referencia y subir
      const fileRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(fileRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            console.error('Error en la subida:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Archivo subido exitosamente a:', filePath);
              resolve({
                url: downloadURL,
                fileName,
                originalName: file.name,
                size: file.size,
                type: file.type
              });
            } catch (error) {
              reject(error);
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
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      return false;
    }
  },

  // Extraer la ruta del archivo desde la URL de descarga
  extractFilePathFromUrl(downloadUrl) {
    try {
      const url = new URL(downloadUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
      if (pathMatch) {
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch (error) {
      console.error('Error extrayendo ruta del archivo:', error);
      return null;
    }
  }
};