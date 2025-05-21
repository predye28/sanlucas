const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Función para validar variables de entorno
function validateEnvironmentVariables() {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID', 
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID',
    'FIREBASE_STORAGE_BUCKET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missing);
    return false;
  }
  
  // Validaciones específicas
  if (!process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
    console.error('❌ FIREBASE_PRIVATE_KEY no parece ser una clave privada válida');
    return false;
  }
  
  if (!process.env.FIREBASE_CLIENT_EMAIL.includes('@')) {
    console.error('❌ FIREBASE_CLIENT_EMAIL no parece ser un email válido');
    return false;
  }
  
  return true;
}

// Validar antes de continuar
if (!validateEnvironmentVariables()) {
  console.error('❌ Por favor verifica tu archivo .env');
  process.exit(1);
}

// Configuración de Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || 
    `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
};

// Debug info (sin mostrar datos sensibles)
console.log('🔥 Configuración Firebase:');
console.log('- Project ID:', serviceAccount.project_id);
console.log('- Client Email:', serviceAccount.client_email);
console.log('- Private Key ID:', serviceAccount.private_key_id?.substring(0, 8) + '...');
console.log('- Private Key valid:', serviceAccount.private_key?.includes('BEGIN PRIVATE KEY'));
console.log('- Storage Bucket:', process.env.FIREBASE_STORAGE_BUCKET);

// Inicializar Firebase Admin si no está ya inicializado
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('✅ Firebase Admin SDK inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin SDK:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Sugerencias de debugging
    console.log('\n🔍 Posibles causas:');
    console.log('1. Verifica que tu service account tenga permisos de "Firebase Authentication Admin"');
    console.log('2. Asegúrate de que el proyecto Firebase esté activo');
    console.log('3. Revisa que las credenciales no estén corruptas');
    
    process.exit(1);
  }
}

const bucket = admin.storage().bucket();
const auth = admin.auth();

// Test de conectividad (opcional)
async function testFirebaseConnection() {
  try {
    // Intentar obtener información del proyecto
    const app = admin.app();
    console.log('✅ Conexión con Firebase verificada');
    return true;
  } catch (error) {
    console.error('❌ Error de conectividad con Firebase:', error.message);
    return false;
  }
}

// Ejecutar test de conectividad
testFirebaseConnection();

module.exports = {
  admin,
  bucket,
  auth
};