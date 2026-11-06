// Reglas de negocio puras de RF-050 y RF-055/058 (sin base de datos).
// Ejecutar: node --test tests/rf-faltantes.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { validarFactura } = require('../controllers/FacturaController');
const { detectarTipo } = require('../controllers/SocioDocumentoController');

const base = { fecha: '2026-11-05', concepto: 'QA_factura', idSocio: 1, detalles: [{ servicio: 'QA_cuota', cantidad: 2, valorUnitario: 10000 }] };

test('RN-003: total = Σ (cantidad × valor − descuento + iva), en centavos exactos', () => {
  const { datos } = validarFactura({
    ...base,
    detalles: [
      { servicio: 'A', cantidad: 3, valorUnitario: 0.1 },                       // 0.30
      { servicio: 'B', cantidad: 1, valorUnitario: 10000, descuento: 1, iva: 0.2 }, // 9999.20
    ],
  });
  assert.equal(datos.total, 9999.5);
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
  assert.match(validarFactura({ ...base, detalles: [{ servicio: 'X', valorUnitario: 10, descuento: 11 }] }).error, /descuento no puede superar/);
  assert.match(validarFactura({ ...base, detalles: [{ servicio: 'X', valorUnitario: 10, iva: -1 }] }).error, /negativos/);
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
