const { Pool } = require('pg');
require('dotenv').config();

// Test 1: Pool con configuración ORIGINAL (sin keepAlive)
const poolOriginal = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 600000,
  connectionTimeoutMillis: 20000,
  keepAlive: true,
  keepAliveInitialDelay: 10000,
});

// Test 2: Pool con conexión directa (sin pooler)
const poolDirecto = new Pool({
  host: process.env.DB_HOST.replace('.pooler.', '.direct.'),
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 600000,
  connectionTimeoutMillis: 20000,
  keepAlive: true,
  keepAliveInitialDelay: 10000,
});

async function testPool(name, pool) {
  console.log(`\n=== Probando ${name} ===`);
  try {
    console.log('1) Primera query...');
    const r1 = await pool.query('SELECT NOW()');
    console.log('   OK:', r1.rows[0]);

    console.log('Esperando 5 segundos...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('2) Segunda query...');
    const r2 = await pool.query('SELECT NOW()');
    console.log('   OK:', r2.rows[0]);

    console.log('Esperando 60 segundos...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    console.log('3) Tercera query...');
    const r3 = await pool.query('SELECT NOW()');
    console.log('   OK:', r3.rows[0]);

    console.log('Esperando 120 segundos más...');
    await new Promise(resolve => setTimeout(resolve, 120000));

    console.log('4) Cuarta query...');
    const r4 = await pool.query('SELECT NOW()');
    console.log('   OK:', r4.rows[0]);

    console.log(`✅ ${name} FUNCIONA después de 3+ minutos de inactividad`);
    return true;
  } catch (err) {
    console.error(`❌ ${name} FALLÓ:`, err.message);
    return false;
  } finally {
    await pool.end();
  }
}

async function run() {
  console.log('🔍 Diagnóstico de conexión a Supabase');
  console.log('Host original:', process.env.DB_HOST);
  console.log('Host directo:', process.env.DB_HOST.replace('.pooler.', '.direct.'));

  // Test con pool original
  const resultadoOriginal = await testPool('Pool Original (pooler)', poolOriginal);

  // Esperar 10 segundos entre tests
  console.log('\nEsperando 10 segundos antes del siguiente test...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Test con conexión directa
  const resultadoDirecto = await testPool('Pool Directo (sin pooler)', poolDirecto);

  console.log('\n=== RESULTADOS ===');
  console.log(`Pool Original (pooler): ${resultadoOriginal ? '✅ FUNCIONA' : '❌ FALLA'}`);
  console.log(`Pool Directo (sin pooler): ${resultadoDirecto ? '✅ FUNCIONA' : '❌ FALLA'}`);

  if (resultadoDirecto && !resultadoOriginal) {
    console.log('\n💡 SOLUCIÓN: Usar conexión directa en lugar del pooler');
    console.log('   Cambia DB_HOST en .env a: aws-1-us-west-2.direct.supabase.com');
  } else if (resultadoOriginal) {
    console.log('\n💡 El pool original funciona correctamente');
  } else {
    console.log('\n⚠️  Ambos pools fallan - problema de red o DNS');
  }

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});