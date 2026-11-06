// Crea un usuario administrador pidiendo los datos por consola.
//   cd backend && npm run crear-admin
// La clave se escribe sin eco y nunca se guarda en archivos ni se acepta por argumento.
// Usa la misma conexión que el servidor (variables DB_* de backend/.env o del entorno).
require('dotenv').config();
const readline = require('node:readline');
const bcrypt = require('bcryptjs');

const RONDAS_BCRYPT = 12;
const LONGITUD_MINIMA_PASSWORD = 8;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function preguntar(rl, texto, { oculto = false } = {}) {
  return new Promise((resolve) => {
    if (oculto) {
      const escribir = rl._writeToOutput;
      let preguntaMostrada = false;
      rl._writeToOutput = (cadena) => {
        // Solo deja pasar la pregunta, una vez y exacta. Un refresco de línea de
        // readline (retroceso, edición a mitad) llega como pregunta + lo tecleado,
        // y ese texto no debe verse.
        if (!preguntaMostrada && cadena === texto) {
          preguntaMostrada = true;
          escribir.call(rl, cadena);
        }
      };
      rl.question(texto, (respuesta) => {
        rl._writeToOutput = escribir;
        process.stdout.write('\n');
        resolve(respuesta);
      });
    } else {
      rl.question(texto, resolve);
    }
  });
}

async function main() {
  if (!process.stdin.isTTY) {
    console.error('❌ Este script es interactivo: ejecútalo desde una terminal.');
    process.exit(1);
  }

  // Misma resolución de IPv4 que server.js para llegar a Supabase.
  if (process.env.DB_HOST && !process.env.DB_HOST_IP) {
    try {
      const { address } = await require('node:dns').promises.lookup(process.env.DB_HOST, { family: 4 });
      process.env.DB_HOST_IP = address;
    } catch {
      process.env.DB_HOST_IP = process.env.DB_HOST;
    }
  }
  const pool = require('../db');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  try {
    const username = (await preguntar(rl, 'Usuario: ')).trim().toLowerCase();
    const fullName = (await preguntar(rl, 'Nombre completo: ')).trim();
    const email = (await preguntar(rl, 'Correo: ')).trim().toLowerCase();

    const errores = [];
    if (!username) errores.push('El usuario es obligatorio');
    if (username.length > 50) errores.push('El usuario no puede tener más de 50 caracteres');
    if (!fullName) errores.push('El nombre completo es obligatorio');
    if (!FORMATO_EMAIL.test(email)) errores.push('El correo no tiene un formato válido');
    if (errores.length) throw new Error(errores.join('\n'));

    const existente = await pool.query(
      'SELECT 1 FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
      [username, email]
    );
    if (existente.rows.length) throw new Error('Ya existe un usuario con ese nombre o correo');

    const password = await preguntar(rl, `Clave (mínimo ${LONGITUD_MINIMA_PASSWORD} caracteres): `, { oculto: true });
    const confirmacion = await preguntar(rl, 'Repite la clave: ', { oculto: true });
    if (password.length < LONGITUD_MINIMA_PASSWORD) {
      throw new Error(`La clave debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`);
    }
    if (password !== confirmacion) throw new Error('Las claves no coinciden');

    const hash = await bcrypt.hash(password, RONDAS_BCRYPT);
    const { rows } = await pool.query(
      `INSERT INTO users (username, password, email, full_name, role, active)
       VALUES ($1, $2, $3, $4, 'admin', true)
       RETURNING id, username`,
      [username, hash, email, fullName]
    );
    console.log(`✅ Administrador creado: ${rows[0].username} (id ${rows[0].id})`);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exitCode = 1;
  } finally {
    rl.close();
    await pool.end();
  }
}

main();
