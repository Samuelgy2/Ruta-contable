// Reglas de negocio puras de RF-050 y RF-055/058 (sin base de datos).
// Ejecutar: node --test tests/rf-faltantes.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { validarFactura, totalLineaCentavos } = require('../controllers/FacturaController');
const { detectarTipo } = require('../controllers/SocioDocumentoController');

const base = { fecha: '2026-11-05', concepto: 'QA_factura', idSocio: 1, detalles: [{ servicio: 'QA_cuota', cantidad: 2, valorUnitario: 10000 }] };

test('RN-003: total = Σ cantidad × valor × (1 − desc%) × (1 + IVA%), en centavos exactos', () => {
  const { datos } = validarFactura({
    ...base,
    detalles: [
      { servicio: 'A', cantidad: 3, valorUnitario: 0.1 },                          // 0.30
      { servicio: 'B', cantidad: 2, valorUnitario: 10000, descuento: 10 },          // 18000.00
      { servicio: 'C', cantidad: 1, valorUnitario: 50000, iva: 19 },                // 59500.00
      { servicio: 'D', cantidad: 1, valorUnitario: 333.33, descuento: 5, iva: 19 }, // 316.66 → 376.83
    ],
  });
  assert.equal(datos.total, 77877.13);
  assert.equal(totalLineaCentavos({ cantidad: 1, valorUnitario: 100, descuento: 100 }), 0);
});

test('descuento e IVA son porcentajes 0..100 y el total respeta numeric(10,2)', () => {
  assert.match(validarFactura({ ...base, detalles: [{ servicio: 'X', valorUnitario: 10, descuento: 101 }] }).error, /porcentajes/);
  assert.match(validarFactura({ ...base, detalles: [{ servicio: 'X', valorUnitario: 10, iva: 9500 }] }).error, /porcentajes/);
  assert.match(validarFactura({ ...base, detalles: [{ servicio: 'X', cantidad: 2, valorUnitario: 60000000 }] }).error, /máximo/);
  assert.match(validarFactura({ ...base, detalles: [{ servicio: 'X', valorUnitario: 10, descuento: 100 }] }).error, /mayor a cero/);
});

test('RN-001: exige socio o proveedor, pero no ambos', () => {
  assert.match(validarFactura({ ...base, idSocio: null }).error, /socio o un proveedor/);
  assert.match(validarFactura({ ...base, proveedorNombre: 'QA_prov' }).error, /socio o un proveedor/);
  assert.equal(validarFactura({ ...base, idSocio: null, proveedorNombre: 'QA_prov' }).datos.proveedor, 'QA_prov');
});

test('RN-002: al menos un detalle', () => {
  assert.match(validarFactura({ ...base, detalles: [] }).error, /al menos un detalle/);
});

test('límites de detalle: cantidad, valor, descuento', () => {
  assert.match(validarFactura({ ...base, detalles: [{ servicio: 'X', cantidad: 0, valorUnitario: 1 }] }).error, /cantidad/);
  assert.match(validarFactura({ ...base, detalles: [{ servicio: 'X', cantidad: 1.5, valorUnitario: 1 }] }).error, /cantidad/);
  assert.match(validarFactura({ ...base, detalles: [{ servicio: 'X', valorUnitario: 0 }] }).error, /valor unitario/);
  assert.match(validarFactura({ ...base, detalles: [{ servicio: 'X', valorUnitario: 10, iva: -1 }] }).error, /porcentajes/);
  assert.match(validarFactura({ ...base, detalles: [{ servicio: '', valorUnitario: 10 }] }).error, /producto o servicio/);
});

test('fechas: vencimiento no anterior a la fecha', () => {
  assert.match(validarFactura({ ...base, fechaVencimiento: '2026-11-01' }).error, /vencimiento/);
  assert.equal(validarFactura({ ...base, fechaVencimiento: '2026-11-30' }).datos.fechaVencimiento, '2026-11-30');
  assert.match(validarFactura({ ...base, fecha: 'no-fecha' }).error, /fecha válida/);
});

test('RF-050: tipo de archivo por firma, no por extensión', () => {
  assert.equal(detectarTipo(Buffer.from('%PDF-1.7 ...')), 'application/pdf');
  assert.equal(detectarTipo(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
  assert.equal(detectarTipo(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), 'image/png');
  assert.equal(detectarTipo(Buffer.from('MZ ejecutable')), null);
  assert.equal(detectarTipo(Buffer.alloc(0)), null);
});
