// test-api.js
const http = require('http');

console.log('🧪 Probando API de Express...\n');

// Probar health check (ruta principal)
const testHome = () => {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ GET / - OK');
        console.log(`   Respuesta: ${data.substring(0, 100)}...`);
        resolve();
      });
    }).on('error', reject);
  });
};

// Probar obtener usuarios
const testGetUsers = () => {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/users', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ GET /api/users - OK');
          const response = JSON.parse(data);
          console.log(`   Usuarios encontrados: ${response.data?.length || 0}`);
        } else {
          console.log('⚠️ GET /api/users - Respuesta inesperada');
        }
        resolve();
      });
    }).on('error', reject);
  });
};

// Probar crear un usuario
const testCreateUser = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: 'Usuario Test',
      email: `test${Date.now()}@email.com`,
      password: '123456'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log('✅ POST /api/users - OK');
          console.log(`   Usuario creado exitosamente`);
        } else {
          console.log(`⚠️ POST /api/users - Status: ${res.statusCode}`);
        }
        resolve();
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// Ejecutar pruebas
async function runTests() {
  try {
    await testHome();
    await testGetUsers();
    await testCreateUser();
    await testGetUsers(); // Verificar que se creó
    console.log('\n🎉 Todas las pruebas completadas!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Asegúrate de que el servidor esté corriendo:');
    console.log('   node src/index.js');
  }
}

runTests();