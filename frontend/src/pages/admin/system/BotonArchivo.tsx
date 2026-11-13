// Botón para elegir un archivo: sustituye al <input type="file"> nativo, que no
// se reconoce como botón. El input sigue en el DOM (oculto sólo a la vista) para
// no perder teclado ni lector de pantalla.
import React from 'react';
import { Sparkles } from 'lucide-react';
import './BotonArchivo.css';

interface BotonArchivoProps {
  id: string;
  accept: string;
  archivo: File | null;
  onChange: (archivo: File | null) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  describedBy?: string;
}

// Posición, tamaño, color y recorrido de cada brillito (--dx/--dy: hasta dónde llega).
const CHISPAS = [
  { left: '6%',  top: '-6px', tam: 10, color: '#34d399', dx: -12, dy: -16, retraso: 0 },
  { left: '30%', top: '-8px', tam: 8,  color: '#10b981', dx: -4,  dy: -18, retraso: 0.15 },
  { left: '58%', top: '-8px', tam: 12, color: '#6ee7b7', dx: 6,   dy: -18, retraso: 0.3 },
  { left: '90%', top: '-6px', tam: 9,  color: '#059669', dx: 12,  dy: -14, retraso: 0.45 },
  { left: '97%', top: '62%',  tam: 8,  color: '#34d399', dx: 18,  dy: 4,   retraso: 0.6 },
  { left: '2%',  top: '78%',  tam: 9,  color: '#10b981', dx: -16, dy: 8,   retraso: 0.75 },
] as const;

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

export function BotonArchivo({ id, accept, archivo, onChange, inputRef, describedBy }: BotonArchivoProps) {
  return (
    <div className="boton-archivo">
      <span className="boton-archivo__envoltura">
        <input
          id={id}
          ref={inputRef}
          className="boton-archivo__input"
          type="file"
          accept={accept}
          onChange={e => onChange(e.target.files?.[0] ?? null)}
          aria-describedby={describedBy}
        />
        <label htmlFor={id} className="boton-archivo__boton">
          <Sparkles className="boton-archivo__icono" size={16} aria-hidden="true" />
          {archivo ? 'Cambiar imagen' : 'Elegir imagen'}
        </label>
        {CHISPAS.map((c, i) => (
          <span
            key={i}
            className="boton-archivo__chispa"
            aria-hidden="true"
            style={{
              left: c.left, top: c.top,
              '--tam': `${c.tam}px`, '--color': c.color,
              '--dx': `${c.dx}px`, '--dy': `${c.dy}px`, '--retraso': `${c.retraso}s`,
            } as React.CSSProperties}
          />
        ))}
      </span>
      <span
        className={`boton-archivo__nombre${archivo ? ' boton-archivo__nombre--elegido' : ''}`}
        aria-live="polite"
      >
        {archivo ? `${archivo.name} · ${kb(archivo.size)}` : 'Ningún archivo seleccionado'}
      </span>
    </div>
  );
}
