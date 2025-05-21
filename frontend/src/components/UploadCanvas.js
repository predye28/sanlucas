import React, { useState, useEffect } from 'react';
import { postService, contenidoService, authService } from '../services/api';

function UploadCanvas({ onClose, onPostCreated, userId }) {
  // Estados para manejar las diferentes etapas
  const [step, setStep] = useState(1); // 1: subir archivos, 2: detalles del post
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  
  // Verificar token de Firebase al cargar el componente
  useEffect(() => {
    async function verifyFirebaseAuth() {
      try {
        // Verificar si tenemos token de Firebase y es válido
        if (!authService.isFirebaseTokenValid()) {
          await authService.getFirebaseToken();
        }
      } catch (error) {
        console.error('Error verificando autenticación de Firebase:', error);
        setError('Error al preparar la subida de archivos. Intenta recargar la página.');
      }
    }
    
    verifyFirebaseAuth();
  }, []);

  // Manejar la selección de archivos
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar archivos
    const validFiles = files.filter(file => {
      const isValid = (file.type.startsWith('image/') || file.type.startsWith('video/')) 
                      && file.size <= 10 * 1024 * 1024; // 10MB máximo
      return isValid;
    });
    
    if (validFiles.length !== files.length) {
      setError('Algunos archivos fueron omitidos. Solo se permiten imágenes y videos menores a 10MB.');
    }
    
    setSelectedFiles(validFiles);
    
    // Crear URLs para previsualización
    const urls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  // Manejar el drag & drop de archivos
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      file => (file.type.startsWith('image/') || file.type.startsWith('video/'))
               && file.size <= 10 * 1024 * 1024
    );
    
    if (files.length > 0) {
      setSelectedFiles(files);
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  // Avanzar al siguiente paso
  const handleContinue = () => {
    if (selectedFiles.length === 0) {
      setError('Por favor, selecciona al menos un archivo');
      return;
    }
    setStep(2);
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setError('');
    setUploadProgress(0);
    setCurrentFileIndex(0);

    try {
      // Asegurar que tenemos un token de Firebase válido antes de subir
      await authService.ensureFirebaseToken();
      
      // 1. Crear el post primero
      const postData = await postService.create(title, description);
      const postId = postData.post.id;
      
      // 2. Subir cada archivo a Firebase Storage
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setCurrentFileIndex(i + 1);
        
        // Callback para el progreso individual de cada archivo
        const onFileProgress = (progress) => {
          // Calcular progreso total considerando todos los archivos
          const totalProgress = ((i * 100) + progress) / selectedFiles.length;
          setUploadProgress(Math.round(totalProgress));
        };
        
        try {
          await contenidoService.upload(file, postId, onFileProgress);
        } catch (error) {
          console.error(`Error subiendo archivo ${file.name}:`, error);
          // Continuar con el siguiente archivo en lugar de abortar toda la operación
          setError(`Error subiendo ${file.name}. Se continuará con los demás archivos.`);
        }
      }
      
      // 3. Obtener el post completo con su contenido
      const completePost = await postService.getById(postId);
      
      // Llamamos a la función proporcionada por el componente padre
      onPostCreated(completePost.post);
      onClose();
      
    } catch (err) {
      console.error('Error al crear el post:', err);
      setError('Error al crear el post: ' + (err.message || err.toString()));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentFileIndex(0);
    }
  };

  // Remover archivo de la lista
  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    const newUrls = [...previewUrls];
    
    // Revocar la URL del objeto para liberar memoria
    URL.revokeObjectURL(newUrls[index]);
    
    newFiles.splice(index, 1);
    newUrls.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg my-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {step === 1 ? 'Subir contenido' : 'Detalles del post'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isUploading}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
            {error}
          </div>
        )}

        {step === 1 ? (
          // Paso 1: Subir archivos
          <div>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 hover:border-red-500 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                multiple
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="cursor-pointer bg-red-800 hover:bg-red-900 text-white py-2 px-4 rounded inline-block mb-2"
              >
                Seleccionar archivos
              </label>
              <p className="text-gray-500 text-sm mt-2">
                Arrastra y suelta imágenes o videos (máx. 10MB cada uno)
              </p>
            </div>

            {previewUrls.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Vista previa ({selectedFiles.length} archivos):</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      {selectedFiles[index].type.includes('video') ? (
                        <video 
                          src={url} 
                          className="w-full h-32 object-cover rounded" 
                          controls
                        />
                      ) : (
                        <img 
                          src={url} 
                          alt={`Preview ${index}`} 
                          className="w-full h-32 object-cover rounded" 
                        />
                      )}
                      <button 
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={handleContinue}
                disabled={selectedFiles.length === 0}
                className={`py-2 px-4 rounded ${
                  selectedFiles.length === 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-800 hover:bg-red-900 text-white'
                }`}
              >
                Continuar
              </button>
            </div>
          </div>
        ) : (
          // Paso 2: Detalles del post
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Título
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Añade un título a tu post"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Describe tu post"
                rows="3"
              />
            </div>

            {isUploading && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">
                  Subiendo archivo {currentFileIndex} de {selectedFiles.length}: {uploadProgress}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-800 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isUploading}
                className={`py-2 px-4 rounded ${
                  isUploading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isUploading || !title}
                className={`py-2 px-4 rounded ${
                  isUploading || !title
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-800 hover:bg-red-900 text-white'
                }`}
              >
                {isUploading ? 'Subiendo...' : 'Publicar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default UploadCanvas;