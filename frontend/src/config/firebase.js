// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Tu configuración de Firebase (reemplaza con tus datos reales)
const firebaseConfig = {
  apiKey: "AIzaSyBYz3pgYksbfhkf1eiVRsVLf1Ywet2Xtlo",
  authDomain: "sanlucas-25726.firebaseapp.com",
  projectId: "sanlucas-25726",
  storageBucket: "sanlucas-25726.firebasestorage.app",
  messagingSenderId: "165407621536",
  appId: "1:165407621536:web:647c993e5cc08856e2e4c5",
  measurementId: "G-ZEH0FBFP99"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;