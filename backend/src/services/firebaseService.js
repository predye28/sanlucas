const { admin, bucket, auth } = require('../config/firebase');

class FirebaseService {
  
  // Generar token personalizado para autenticación en el frontend
  async generateCustomToken(userId) {
    try {
      // Convertir el ID a string (muy importante)
      const userIdStr = userId.toString();
      
      // Este objeto de claims es crucial - debe coincidir con tus reglas de Firebase
      const additionalClaims = {
        user_id: userIdStr // Exactamente como aparece en tus reglas
      };
      
      console.log(`Generando token para usuario ${userIdStr} con claims:`, additionalClaims);
      
      const customToken = await auth.createCustomToken(userIdStr, additionalClaims);
      return customToken;
    } catch (error) {
      console.error('Error generando custom token:', error);
      throw new Error(`Error generando token de Firebase: ${error.message}`);
    }
  }

  // Verificar permisos de usuario para un archivo
  async verifyUserPermission(userId, filePath) {
    // Extraer partes de la ruta para validar
    const parts = filePath.split('/');
    if (parts[0] === 'posts' && parts[1]) {
      // Si es una ruta de posts, verificar que el userId coincida
      return parts[1] === userId.toString();
    }
    return false;
  }


  // Generar ruta para un post
  getPostFilePath(userId, postId, filename) {
    return `posts/${userId}/${postId}/${filename}`;
  }

  // Obtener URL pública
  async getPublicUrl(filePath) {
    return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  }


  // Verificar si un archivo existe en Storage
  async fileExists(filePath) {
    try {
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error('Error verificando archivo:', error);
      return false;
    }
  }

  // Eliminar archivo de Firebase Storage
  async deleteFile(filePath) {
    try {
      const file = bucket.file(filePath);
      await file.delete();
      console.log(`Archivo eliminado: ${filePath}`);
      return true;
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      return false;
    }
  }

  // Obtener URL firmada para un archivo (opcional, para URLs temporales)
  async getSignedUrl(filePath, expirationMinutes = 60) {
    try {
      const file = bucket.file(filePath);
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expirationMinutes * 60 * 1000, // en milisegundos
      });
      return signedUrl;
    } catch (error) {
      console.error('Error generando URL firmada:', error);
      throw new Error('Error generando URL de acceso');
    }
  }

  // Validar que un archivo en Firebase pertenece a un usuario (verificación de seguridad)
  validateFilePath(filePath, userId, postId) {
    const expectedPath = `posts/${userId}/${postId}/`;
    return filePath.startsWith(expectedPath);
  }

  // Limpiar archivos huérfanos (opcional, para mantenimiento)
  async cleanupOrphanedFiles(userId, validPostIds) {
    try {
      const [files] = await bucket.getFiles({
        prefix: `posts/${userId}/`
      });

      const filesToDelete = files.filter(file => {
        const pathParts = file.name.split('/');
        if (pathParts.length >= 3) {
          const postId = pathParts[2];
          return !validPostIds.includes(parseInt(postId));
        }
        return false;
      });

      for (const file of filesToDelete) {
        await file.delete();
        console.log(`Archivo huérfano eliminado: ${file.name}`);
      }

      return filesToDelete.length;
    } catch (error) {
      console.error('Error limpiando archivos huérfanos:', error);
      return 0;
    }
  }
}

module.exports = new FirebaseService();