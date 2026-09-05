import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  desde: number;
  hasta: number;
  irA: (pagina: number) => void;
  anterior: () => void;
  siguiente: () => void;
  // Qué se está paginando, para el texto "Mostrando 1–5 de 23 socios".
  etiqueta?: string;
}

// Devuelve los números de página a pintar, con puntos suspensivos cuando hay
// muchas: 1 … 4 5 6 … 20. Siempre se ven la primera, la última y la actual.
function paginasVisibles(actual: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const cerca = new Set([1, total, actual - 1, actual, actual + 1]);
  const lista: (number | '…')[] = [];

  for (let p = 1; p <= total; p++) {
    if (cerca.has(p)) {
      lista.push(p);
    } else if (lista[lista.length - 1] !== '…') {
      lista.push('…');
    }
  }
  return lista;
}

export function Paginacion({
  pagina, totalPaginas, total, desde, hasta, irA, anterior, siguiente, etiqueta = 'registros',
}: PaginacionProps) {
  // Con una sola página no hay nada que navegar; se muestra sólo el conteo.
  if (total === 0) return null;

  return (
    <nav className="paginacion" aria-label="Paginación">
      <span className="paginacion-info">
        Mostrando {desde}–{hasta} de {total} {etiqueta}
      </span>

      {totalPaginas > 1 && (
        <div className="paginacion-controles">
          <button
            type="button"
            className="paginacion-btn"
            onClick={anterior}
            disabled={pagina === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          {paginasVisibles(pagina, totalPaginas).map((p, i) =>
            p === '…' ? (
              <span key={`sep-${i}`} className="paginacion-puntos">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`paginacion-btn ${p === pagina ? 'is-active' : ''}`.trim()}
                onClick={() => irA(p)}
                aria-current={p === pagina ? 'page' : undefined}
                aria-label={`Página ${p}`}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            className="paginacion-btn"
            onClick={siguiente}
            disabled={pagina === totalPaginas}
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </nav>
  );
}

export default Paginacion;
