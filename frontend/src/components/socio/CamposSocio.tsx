// Campos de la ficha de socio que diligencia el aspirante en el registro
// público y el administrador al crear una cuenta con un socio nuevo.
// Las reglas son las mismas de backend/utils/socio.js (validarDatosSocio).
import React from 'react';
import { hoyLocal } from '../../utils/format';

export interface DatosSocio {
  nombre: string;
  tipo_documento: 'CC' | 'TI' | 'CE' | 'PAS';
  documento: string;
  fecha_nacimiento: string;
  telefono: string;
  direccion: string;
  nivel_aprendizaje: '' | 'Iniciación' | 'Rider School' | 'Club';
}

export const SOCIO_VACIO: DatosSocio = {
  nombre: '', tipo_documento: 'CC', documento: '', fecha_nacimiento: '',
  telefono: '', direccion: '', nivel_aprendizaje: '',
};

export function validarSocio(d: DatosSocio): Partial<Record<keyof DatosSocio, string>> {
  const e: Partial<Record<keyof DatosSocio, string>> = {};
  const nombre = d.nombre.trim();
  if (!nombre) e.nombre = 'El nombre completo es obligatorio';
  else if (nombre.length > 100) e.nombre = 'Máximo 100 caracteres';

  const doc = d.documento.trim();
  if (!doc) e.documento = 'El número de documento es obligatorio';
  else if (doc.length > 20) e.documento = 'Máximo 20 caracteres';
  else if (d.tipo_documento !== 'PAS' && !/^\d+$/.test(doc)) e.documento = 'Solo números para CC, TI o CE';

  if (!d.fecha_nacimiento) e.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
  else if (d.fecha_nacimiento > hoyLocal()) e.fecha_nacimiento = 'No puede ser una fecha futura';

  const tel = d.telefono.trim();
  if (!tel) e.telefono = 'El teléfono es obligatorio';
  else if (tel.length > 20 || !/^[0-9+ ]+$/.test(tel)) e.telefono = 'Solo números, espacios y + (máximo 20)';

  if (d.direccion.trim().length > 200) e.direccion = 'Máximo 200 caracteres';
  return e;
}

/** Datos listos para enviar al backend. */
export const socioParaEnviar = (d: DatosSocio) => ({
  ...d,
  nombre: d.nombre.trim(),
  documento: d.documento.trim(),
  telefono: d.telefono.trim(),
  direccion: d.direccion.trim(),
  nivel_aprendizaje: d.nivel_aprendizaje || null,
});

interface CamposSocioProps {
  valor: DatosSocio;
  onChange: (valor: DatosSocio) => void;
  errores?: Partial<Record<keyof DatosSocio, string>>;
  disabled?: boolean;
  // 'registro' usa las clases del formulario público; 'panel', los estilos del panel admin.
  variante: 'registro' | 'panel';
  inputStyle?: React.CSSProperties;
  idPrefijo?: string;
}

export function CamposSocio({ valor, onChange, errores = {}, disabled, variante, inputStyle, idPrefijo = 'socio' }: CamposSocioProps) {
  const set = <K extends keyof DatosSocio>(campo: K, v: DatosSocio[K]) => onChange({ ...valor, [campo]: v });
  const registro = variante === 'registro';

  const campo = (id: keyof DatosSocio, etiqueta: string, control: React.ReactNode, obligatorio = true) => (
    <div className={registro ? 'form-group' : undefined}>
      <label
        htmlFor={`${idPrefijo}-${id}`}
        style={registro ? undefined : { display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '13px' }}
      >
        {etiqueta}{obligatorio && (registro ? ' *' : <span style={{ color: '#ef4444' }}> *</span>)}
      </label>
      {control}
      {errores[id] && (
        <span id={`${idPrefijo}-${id}-error`} className={registro ? 'form-error' : undefined} style={registro ? undefined : { display: 'block', marginTop: '4px', color: '#b91c1c', fontSize: '12px' }}>
          {errores[id]}
        </span>
      )}
    </div>
  );

  const props = (id: keyof DatosSocio) => ({
    id: `${idPrefijo}-${id}`,
    disabled,
    'aria-invalid': Boolean(errores[id]),
    'aria-describedby': errores[id] ? `${idPrefijo}-${id}-error` : undefined,
    className: registro ? `form-input ${errores[id] ? 'error' : ''}` : undefined,
    style: registro ? undefined : { ...inputStyle, borderColor: errores[id] ? '#ef4444' : '#e5e7eb' },
  });

  const fila: React.CSSProperties | undefined = registro ? undefined : { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' };

  return (
    <div style={registro ? undefined : { display: 'grid', gap: '16px' }}>
      {campo('nombre', 'Nombre completo', (
        <input
          {...props('nombre')}
          type="text"
          autoComplete="name"
          maxLength={100}
          placeholder="Nombres y apellidos"
          value={valor.nombre}
          // Solo letras y espacios, como en el formulario de socios del panel.
          onChange={e => set('nombre', e.target.value.replace(/[^\p{L} .'-]/gu, ''))}
        />
      ))}

      <div className={registro ? 'form-row' : undefined} style={fila}>
        {campo('tipo_documento', 'Tipo de documento', (
          <select
            {...props('tipo_documento')}
            value={valor.tipo_documento}
            onChange={e => {
              const tipo = e.target.value as DatosSocio['tipo_documento'];
              onChange({ ...valor, tipo_documento: tipo, documento: tipo === 'PAS' ? valor.documento : valor.documento.replace(/\D/g, '') });
            }}
          >
            <option value="CC">Cédula de ciudadanía</option>
            <option value="TI">Tarjeta de identidad</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="PAS">Pasaporte</option>
          </select>
        ))}
        {campo('documento', 'Número de documento', (
          <input
            {...props('documento')}
            type="text"
            inputMode={valor.tipo_documento === 'PAS' ? 'text' : 'numeric'}
            maxLength={20}
            value={valor.documento}
            onChange={e => set('documento', valor.tipo_documento === 'PAS'
              ? e.target.value.replace(/[^A-Za-z0-9-]/g, '')
              : e.target.value.replace(/\D/g, ''))}
          />
        ))}
      </div>

      <div className={registro ? 'form-row' : undefined} style={fila}>
        {campo('fecha_nacimiento', 'Fecha de nacimiento', (
          <input
            {...props('fecha_nacimiento')}
            type="date"
            max={hoyLocal()}
            value={valor.fecha_nacimiento}
            onChange={e => set('fecha_nacimiento', e.target.value)}
          />
        ))}
        {campo('telefono', 'Teléfono', (
          <input
            {...props('telefono')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="300 123 4567"
            value={valor.telefono}
            onChange={e => set('telefono', e.target.value.replace(/[^0-9+ ]/g, ''))}
          />
        ))}
      </div>

      <div className={registro ? 'form-row' : undefined} style={fila}>
        {campo('direccion', 'Dirección', (
          <input
            {...props('direccion')}
            type="text"
            autoComplete="street-address"
            maxLength={200}
            value={valor.direccion}
            onChange={e => set('direccion', e.target.value)}
          />
        ), false)}
        {campo('nivel_aprendizaje', 'Nivel de aprendizaje', (
          <select
            {...props('nivel_aprendizaje')}
            value={valor.nivel_aprendizaje}
            onChange={e => set('nivel_aprendizaje', e.target.value as DatosSocio['nivel_aprendizaje'])}
          >
            <option value="">No sé / lo define el club</option>
            <option value="Iniciación">Iniciación</option>
            <option value="Rider School">Rider School</option>
            <option value="Club">Club</option>
          </select>
        ), false)}
      </div>
    </div>
  );
}
