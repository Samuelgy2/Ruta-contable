// Llamadas salientes a PayPal con el fetch nativo de Node (sin axios).
//
// El PAYPAL_CLIENT_SECRET se lee de process.env y jamás sale del backend: sólo
// viaja en la autenticación Basic contra el endpoint de token.

const TIEMPO_ESPERA_MS = 10000;   // AbortSignal.timeout por intento
const MAX_REINTENTOS   = 2;       // reintentos adicionales tras el primer intento
const ESPERA_BASE_MS   = 500;     // espera creciente: 500 ms, 1000 ms, …
const MARGEN_TOKEN_MS  = 60000;   // se renueva el token un minuto antes de expirar

// Token cacheado en memoria: pedir uno nuevo en cada llamada es un viaje de red
// de más y PayPal limita la frecuencia.
let tokenCache = { valor: null, expiraEn: 0 };

// Sólo se reintenta cuando el fallo puede ser pasajero.
function esReintentable(status) {
  return status === 429 || (status >= 500 && status <= 599);
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function baseUrl() {
  // Sandbox por defecto: esta integración no debe apuntar a producción.
  return (process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com').replace(/\/+$/, '');
}

function esFalloDeRed(error) {
  return error.name === 'TimeoutError'
    || error.name === 'AbortError'
    || error.name === 'TypeError';
}

// Petición con tiempo de espera y reintento con espera creciente para 5xx y 429.
async function peticion(ruta, { metodo = 'GET', cuerpo = null, cabeceras = {} } = {}) {
  const url = `${baseUrl()}${ruta}`;
  let ultimoError = null;

  for (let intento = 0; intento <= MAX_REINTENTOS; intento++) {
    if (intento > 0) {
      await esperar(ESPERA_BASE_MS * Math.pow(2, intento - 1));
    }

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { Accept: 'application/json', ...cabeceras },
        body: cuerpo ?? undefined,
        signal: AbortSignal.timeout(TIEMPO_ESPERA_MS),
      });

      if (esReintentable(respuesta.status) && intento < MAX_REINTENTOS) {
        ultimoError = new Error(`PayPal respondió ${respuesta.status}`);
        continue;
      }

      const texto = await respuesta.text();
      let datos = null;
      try {
        datos = texto ? JSON.parse(texto) : null;
      } catch {
        datos = null;
      }

      if (!respuesta.ok) {
        const error = new Error(
          datos?.message || datos?.error_description || `PayPal respondió ${respuesta.status}`
        );
        error.status = respuesta.status;
        error.datos = datos;
        throw error;
      }

      return datos;
    } catch (error) {
      if (esFalloDeRed(error) && intento < MAX_REINTENTOS) {
        ultimoError = error;
        continue;
      }
      throw error;
    }
  }

  throw ultimoError || new Error('No se pudo contactar con PayPal');
}

// OAuth2 client_credentials con autenticación Basic.
async function obtenerToken() {
  const ahora = Date.now();

  if (tokenCache.valor && ahora < tokenCache.expiraEn) {
    return tokenCache.valor;
  }

  const basic = Buffer
    .from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`)
    .toString('base64');

  const respuesta = await peticion('/v1/oauth2/token', {
    metodo: 'POST',
    cuerpo: 'grant_type=client_credentials',
    cabeceras: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!respuesta?.access_token) {
    throw new Error('PayPal no devolvió un token de acceso');
  }

  // expires_in llega en segundos; se renueva un minuto antes de caducar.
  const duracionMs = Number(respuesta.expires_in || 0) * 1000;
  tokenCache = {
    valor: respuesta.access_token,
    expiraEn: ahora + Math.max(0, duracionMs - MARGEN_TOKEN_MS),
  };

  return tokenCache.valor;
}

// Petición autenticada con el token de la aplicación.
async function peticionAutenticada(ruta, { metodo = 'GET', cuerpo = null } = {}) {
  const token = await obtenerToken();

  return peticion(ruta, {
    metodo,
    cuerpo: cuerpo ? JSON.stringify(cuerpo) : null,
    cabeceras: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

// POST /v2/checkout/orders — crea la orden con intent CAPTURE.
// La referencia propia viaja en custom_id: es lo que permite reconocer el pago
// cuando llega el webhook.
async function crearOrden({ referencia, monto, moneda, concepto }) {
  return peticionAutenticada('/v2/checkout/orders', {
    metodo: 'POST',
    cuerpo: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: referencia,
          custom_id: referencia,
          description: concepto,
          amount: {
            currency_code: moneda,
            value: Number(monto).toFixed(2),
          },
        },
      ],
    },
  });
}

// POST /v2/checkout/orders/{id}/capture — cobra de verdad una orden aprobada.
async function capturarOrden(ordenId) {
  return peticionAutenticada(`/v2/checkout/orders/${encodeURIComponent(ordenId)}/capture`, {
    metodo: 'POST',
    cuerpo: {},
  });
}

// GET /v2/checkout/orders/{id} — estado actual de la orden.
async function consultarOrden(ordenId) {
  return peticionAutenticada(`/v2/checkout/orders/${encodeURIComponent(ordenId)}`);
}

// POST /v1/notifications/verify-webhook-signature — verificación remota.
// Recibe las cabeceras de la petición entrante y el evento ya parseado.
// Devuelve true sólo si verification_status vale 'SUCCESS'.
async function verificarFirmaWebhook(cabeceras, evento) {
  const leer = (nombre) => cabeceras[nombre] ?? cabeceras[nombre.toLowerCase()] ?? null;

  const cuerpo = {
    auth_algo: leer('paypal-auth-algo'),
    cert_url: leer('paypal-cert-url'),
    transmission_id: leer('paypal-transmission-id'),
    transmission_sig: leer('paypal-transmission-sig'),
    transmission_time: leer('paypal-transmission-time'),
    webhook_id: process.env.PAYPAL_WEBHOOK_ID,
    webhook_event: evento,
  };

  // Sin las cinco cabeceras no hay nada que verificar: se rechaza sin llamar.
  const faltaAlguna = ['auth_algo', 'cert_url', 'transmission_id', 'transmission_sig', 'transmission_time']
    .some(campo => !cuerpo[campo]);

  if (faltaAlguna) return false;

  try {
    const respuesta = await peticionAutenticada('/v1/notifications/verify-webhook-signature', {
      metodo: 'POST',
      cuerpo,
    });

    return respuesta?.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('❌ Error verificando la firma del webhook de PayPal:', error.message);
    return false;
  }
}

module.exports = {
  crearOrden,
  capturarOrden,
  consultarOrden,
  verificarFirmaWebhook,
  obtenerToken,
  TIEMPO_ESPERA_MS,
};
