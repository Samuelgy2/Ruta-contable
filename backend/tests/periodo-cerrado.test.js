// RN-018.3 / RF-034: un periodo cerrado no admite movimientos nuevos, editados ni
// borrados con fecha en ese mes. Las pruebas no tocan ninguna base de datos: se
// reemplazan pool.query y pool.connect por una base simulada en memoria.
// Ejecutar: node --test tests/periodo-cerrado.test.js

// Cinturón de seguridad: si alguna consulta escapara a la simulación, apuntaría a
// un puerto local cerrado y fallaría, en vez de llegar a la base de producción.
process.env.DB_HOST_IP = '127.0.0.1';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_SSL = 'false';

const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../db');
const { buscarPeriodoCerrado } = require('../utils/periodoCerrado');
const transacciones = require('../controllers/TransactionController');
const pagosMensuales = require('../controllers/PagoMensualController');

// Mes 'AAAA-MM' de un valor de fecha tal como lo recibiría Postgres.
function mesDe(f) {
  if (f instanceof Date) return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
  return String(f).slice(0, 7);
}

const NOMBRES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Base simulada: meses cerrados, una transacción y un pago mensual de ejemplo.
function simularBase({ cerrados = ['2026-09'], transaccion = null, pago = null } = {}) {
  const consultas = [];
  let conexiones = 0;
  pool.query = async (sql, params = []) => {
    consultas.push({ sql, params });
    if (sql.includes('FROM meses_periodo')) {
      const mes = params[0].map(mesDe).find((m) => cerrados.includes(m));
      if (!mes) return { rows: [] };
      const [anio, num] = mes.split('-').map(Number);
      return { rows: [{ anio, mes: num, nombre_mes: NOMBRES[num - 1] }] };
    }
    if (sql.includes('FROM categories')) return { rows: [{ id: 7, name: 'Cuotas', type: 'income', active: true }] };
    if (sql.includes('SELECT * FROM transactions')) return { rows: transaccion ? [transaccion] : [] };
    if (sql.includes('SELECT fecha FROM transactions')) return { rows: transaccion ? [{ fecha: transaccion.fecha }] : [] };
    if (sql.includes('INSERT INTO transactions')) return { rows: [{ id: 99 }] };
    if (sql.includes('UPDATE transactions')) return { rows: [{ ...transaccion }] };
    if (sql.includes('DELETE FROM transactions')) return { rows: [{ id: transaccion.id }] };
    if (sql.includes('SELECT * FROM pago_mensual')) return { rows: pago ? [pago] : [] };
    throw new Error(`Consulta no simulada: ${sql}`);
  };
  pool.connect = async () => {
    conexiones++;
    return {
      query: async (sql) => {
        consultas.push({ sql, params: [] });
        if (sql.includes('SELECT * FROM pago_mensual')) return { rows: [{ ...pago, estado: 'pagado' }] };
        return { rows: [] };
      },
      release() {},
    };
  };
  return {
    consultas,
    conexiones: () => conexiones,
    hubo: (texto) => consultas.some((c) => c.sql.includes(texto)),
  };
}

function respuestaFalsa() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

const req = (extra) => ({ params: {}, body: {}, user: { id: 1 }, ...extra });
const ingreso = { tipo: 'ingreso', monto: '24', descripcion: 'QA', categoriaId: 7 };

test('buscarPeriodoCerrado: sin fechas no consulta la base', async () => {
  const base = simularBase();
  assert.equal(await buscarPeriodoCerrado([undefined, null, '']), null);
  assert.equal(base.consultas.length, 0);
});

test('buscarPeriodoCerrado: encuentra el mes cerrado entre varias fechas', async () => {
  simularBase();
  assert.equal(await buscarPeriodoCerrado(['2026-10-02']), null);
  const periodo = await buscarPeriodoCerrado(['2026-10-02', '2026-09-05']);
  assert.deepEqual(periodo, { anio: 2026, mes: 9, nombre_mes: 'septiembre' });
});

test('crear: una transacción con fecha en un mes cerrado se rechaza con 409 y no se inserta', async () => {
  const base = simularBase();
  const res = respuestaFalsa();
  await transacciones.create(req({ body: { ...ingreso, fecha: '2026-09-05' } }), res);
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /septiembre 2026 está cerrado/);
  assert.equal(base.hubo('INSERT INTO transactions'), false);
});

test('crear: con fecha en un mes abierto se registra normalmente', async () => {
  const base = simularBase();
  const res = respuestaFalsa();
  await transacciones.create(req({ body: { ...ingreso, fecha: '2026-10-05' } }), res);
  assert.equal(res.statusCode, 201);
  assert.equal(base.hubo('INSERT INTO transactions'), true);
});

test('editar: una transacción de un mes cerrado no se puede modificar', async () => {
  const base = simularBase({ transaccion: { id: 5, tipo: 'ingreso', fecha: new Date(2026, 8, 5) } });
  const res = respuestaFalsa();
  await transacciones.update(req({ params: { id: '5' }, body: { monto: '48' } }), res);
  assert.equal(res.statusCode, 409);
  assert.equal(base.hubo('UPDATE transactions'), false);
});

test('editar: no se puede mover una transacción abierta a un mes cerrado', async () => {
  const base = simularBase({ transaccion: { id: 6, tipo: 'ingreso', fecha: new Date(2026, 9, 3) } });
  const res = respuestaFalsa();
  await transacciones.update(req({ params: { id: '6' }, body: { fecha: '2026-09-30' } }), res);
  assert.equal(res.statusCode, 409);
  assert.equal(base.hubo('UPDATE transactions'), false);
});

test('editar: una transacción de un mes abierto se actualiza normalmente', async () => {
  const base = simularBase({ transaccion: { id: 7, tipo: 'ingreso', fecha: new Date(2026, 9, 3) } });
  const res = respuestaFalsa();
  await transacciones.update(req({ params: { id: '7' }, body: { monto: '50' } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(base.hubo('UPDATE transactions'), true);
});

test('eliminar: una transacción de un mes cerrado no se borra', async () => {
  const base = simularBase({ transaccion: { id: 8, tipo: 'ingreso', fecha: new Date(2026, 8, 12) } });
  const res = respuestaFalsa();
  await transacciones.remove(req({ params: { id: '8' } }), res);
  assert.equal(res.statusCode, 409);
  assert.equal(base.hubo('DELETE FROM transactions'), false);
});

test('eliminar: una transacción de un mes abierto se borra y una inexistente da 404', async () => {
  const base = simularBase({ transaccion: { id: 9, tipo: 'ingreso', fecha: new Date(2026, 9, 12) } });
  const res = respuestaFalsa();
  await transacciones.remove(req({ params: { id: '9' } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(base.hubo('DELETE FROM transactions'), true);

  simularBase();
  const res404 = respuestaFalsa();
  await transacciones.remove(req({ params: { id: '404' } }), res404);
  assert.equal(res404.statusCode, 404);
});

const pagoPendiente = { id_pago: 3, estado: 'pendiente', valor: '24', fecha_vencimiento: new Date(2026, 7, 31), fecha_pago: null, dias_mora: 0 };

test('pago mensual: marcarlo pagado con fecha en un mes cerrado se rechaza y no genera el ingreso', async () => {
  const base = simularBase({ pago: pagoPendiente });
  const res = respuestaFalsa();
  await pagosMensuales.update(req({ params: { id: '3' }, body: { estado: 'pagado', fechaPago: '2026-09-05', metodoPago: 'efectivo' } }), res);
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /septiembre 2026 está cerrado/);
  assert.equal(base.conexiones(), 0, 'no debe abrir la transacción que llama a registrar_pago_mensual');
});

test('pago mensual: con fecha de pago en un mes abierto se registra el pago', async () => {
  const base = simularBase({ pago: pagoPendiente });
  const res = respuestaFalsa();
  await pagosMensuales.update(req({ params: { id: '3' }, body: { estado: 'pagado', fechaPago: '2026-10-05', metodoPago: 'efectivo' } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(base.conexiones(), 1);
  assert.equal(base.hubo('registrar_pago_mensual'), true);
});
