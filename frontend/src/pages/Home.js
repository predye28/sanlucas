import React, { useState, useEffect } from 'react';
import { authService, postService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import UploadCanvas from '../components/UploadCanvas'; // Importaremos este componente que crearemos después

function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadCanvas, setShowUploadCanvas] = useState(false); // Estado para controlar la visualización del canvas
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setUser(currentUser);
    
    // Cargar posts del usuario
    async function loadPosts() {
      try {
        const data = await postService.getAll();
        setPosts(data.posts || []);
      } catch (err) {
        setError('Error al cargar los posts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadPosts();
    console.log(posts)
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleUploadClick = () => {
    setShowUploadCanvas(true);
  };

  const handleCloseCanvas = () => {
    setShowUploadCanvas(false);
  };

  const handlePostCreated = (newPost) => {
    // Actualizamos la lista de posts cuando se crea uno nuevo
    setPosts([newPost, ...posts]);
    setShowUploadCanvas(false);
  };

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white p-4 shadow">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">San Lucas</h1>
        </div>
      </header>
      
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mr-6">
              <img 
                src={user?.foto_perfil_url || "https://via.placeholder.com/100"} 
                alt="Perfil" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user?.username}</h2>
              <p className="text-gray-600">{posts.length} post</p>
              <p className="text-gray-600">bio; searching hobbies and i love my family</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-2">
              <button 
                onClick={handleUploadClick} 
                className="bg-red-800 hover:bg-red-900 text-white py-2 px-4 rounded"
              >
                upload
              </button>
              <button 
                className="bg-red-800 hover:bg-red-900 text-white py-2 px-4 rounded"
              >
                edit profile
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-800 hover:bg-red-900 text-white py-2 px-4 rounded"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {posts.map(post => (
            <div key={post.id} className="border bg-white rounded overflow-hidden shadow p-4">
              <h3 className="font-bold">{post.titulo}</h3>
              <p>{post.descripcion}</p>
              <p className="text-sm text-gray-500">
                {new Date(post.fecha_creacion).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Canvas Superpuesto para Upload */}
      {showUploadCanvas && (
        <UploadCanvas 
          onClose={handleCloseCanvas}
          onPostCreated={handlePostCreated}
          userId={user?.id}
        />
      )}
    </div>
  );
}

export default Home;