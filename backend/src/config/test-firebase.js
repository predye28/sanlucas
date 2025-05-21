require('dotenv').config();
const { admin } = require('../config/firebase');

async function testFirebase() {
  try {
    const bucket = admin.storage().bucket();
    console.log('✅ Conexión exitosa a Firebase Storage');
    console.log('Bucket:', bucket.name);
    
    // Test de autenticación
    const customToken = await admin.auth().createCustomToken('test-user');
    console.log('✅ Generación de token exitosa');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFirebase();