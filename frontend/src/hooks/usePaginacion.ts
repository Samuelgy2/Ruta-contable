import { useEffect, useMemo, useState } from 'react';

// Paginación en el cliente sobre un arreglo ya cargado. Máximo TAMANO_PAGINA
// registros por página; al cambiar la lista (filtro, recarga) vuelve a la
// primera página y nunca deja la página actual fuera de rango.
export const TAMANO_PAGINA = 5;

export function usePaginacion<T>(items: T[], tamano: number = TAMANO_PAGINA) {
  const [pagina, setPagina] = useState(1);

  const total = items.length;
  const totalPaginas = Math.max(1, Math.ceil(total / tamano));

  // Si la lista cambia de tamaño (nuevo filtro o recarga), se vuelve al inicio.
  useEffect(() => {
    setPagina(1);
  }, [total]);

  // Si por cualquier motivo la página quedó fuera de rango, se ajusta.
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [pagina, totalPaginas]);

  const paginaSegura = Math.min(pagina, totalPaginas);
  const inicio = (paginaSegura - 1) * tamano;

  const itemsPagina = useMemo(
    () => items.slice(inicio, inicio + tamano),
    [items, inicio, tamano]
  );

  return {
    itemsPagina,
    pagina: paginaSegura,
    totalPaginas,
    total,
    tamano,
    // Índices 1-based para "Mostrando 1–5 de 23".
    desde: total === 0 ? 0 : inicio + 1,
    hasta: Math.min(inicio + tamano, total),
    irA: (p: number) => setPagina(Math.min(Math.max(1, p), totalPaginas)),
    anterior: () => setPagina(p => Math.max(1, p - 1)),
    siguiente: () => setPagina(p => Math.min(totalPaginas, p + 1)),
  };
}

export type Paginacion = ReturnType<typeof usePaginacion>;
