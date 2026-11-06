# docs/fuentes — copias locales de las fuentes de Drive

Los agentes leen estas copias, no Drive (PLAN_ENTREGA_FINAL.md §6 "Fuentes para los agentes").

## Matriz de requisitos

- Origen: Drive › Documentacion › "Matriz de requisitos" (.xlsx), id `1nXJ7u5gQb2XSq1pVsM6VYh_cEOQxWtzr`, modificada 2026-11-03T04:37:23Z.
- Descargada el 2026-11-05 por T1. Tamaño 177143 bytes, igual al `fileSize` que reporta Drive.
- `matriz_requisitos.xlsx`: el archivo original, sin cambios.

| Archivo | Hoja | Contenido |
|---|---|---|
| `matriz_rnf.csv` | RNF | Exportación literal: 10 RNF (RNF-001 a RNF-010) |
| `matriz_rf.csv` | RF | Exportación literal: 87 RF |
| `matriz_rs.csv` | RS | Exportación literal: requisitos del sistema (RS-01 en adelante) |
| `matriz_trazabilidad.csv` | Trazabilidad | Exportación literal: RF contra CU |
| `matriz_rf_plano.csv` | RF | Derivado, pensado para L1 y `check_cobertura.py` |

### Cómo se exportó

- Exportación literal: cada celda tal cual (valores calculados, `data_only`) y sin las filas vacías del final. Una celda combinada solo trae su valor en la esquina superior izquierda, así que en las filas siguientes Proceso y Subproceso salen vacíos.
- `matriz_rf_plano.csv` sale de la hoja RF con estos cambios:
  1. Se rellena cada rango combinado con el valor de su esquina superior izquierda. Proceso y Subproceso de las 87 filas salen todos de celdas combinadas; no se arrastró ningún valor por fuera de ellas.
  2. El id se normaliza de `RF - 001` a `RF-001`. Los ids RI y RN se dejan como vienen (`RI-001`, `RN- 001`).
  3. `fila_xlsx` es la fila de la hoja RF, para citar la evidencia.
  4. `col_j`, `col_k` y `col_l` son las columnas sin encabezado que hay a la derecha de Reglas de negocio. Ahí aparecen las celdas sueltas de las anomalías, por ejemplo `51/66` y `X` (PLAN §1.1).

### Comprobado al exportar

- Hoja RF: 87 filas de RF, 87 ids únicos, de RF-001 a RF-087.
- Filas por proceso: Financiera 23, Configuracion del sistema 8, Socios 8, Administrador 7, Usuario 6, Pagos 6, inventario 6, Asistencia 6, Cartera 5, Jersey 4, Categoria 4, compras 2, Proveedores 2. Son 13 procesos, igual que en el PLAN §1.1.
- Hoja RNF: 10 ids únicos.

### Notas para L1 (sin resolver)

- La hoja Trazabilidad numera por proceso (`RF-1 001`, `CU-1 01`, `CU-07 01`) y no usa la numeración global RF-001…087. No se comprobó si las dos numeraciones se corresponden: NO VERIFICADO.
- La hoja RF tiene un `Baja` suelto en la fila 8, columna E, encima del encabezado.

## Planes de prueba (`planes/`)

- Origen: Drive › Documentacion › Planes de prueba (carpeta `1Da_0BrVfZe6WU4qVcJKmi_6utwRuXD8r`).
- Descargados el 2026-11-05 por T1. Cada archivo pesa exactamente lo que reporta Drive (`fileSize`).

| Archivo | Id de Drive | Modificado | Bytes |
|---|---|---|---|
| 01 Plan de pruebas inicio de sesion administrador.docx | `11t31-vD2-t4JbyLChB9hJNY9PdIkXOOz` | 2026-11-03 | 328553 |
| 02 Plan de pruebas gestion de administrador.docx | `1oyoITVNkmC1xJrZG30LnKL-u0Jnh9DES` | 2026-11-03 | 326480 |
| 03 Plan de pruebas visualizacion del sistema.docx | `1WQgpqtZXNPOsp4M-YrOBNa7v6jbAvd0_` | 2026-11-03 | 240794 |
| 04 Plan de pruebas datos del club.docx | `140yc9x99igo_DfSA7zvDW8fXJZdEzk08` | 2026-11-03 | 405741 |
| 05 Plan de pruebas gestion de usuario.docx | `15q9PxgmdZ2ofHsV2khvhEtjOJqySGZcR` | 2026-11-03 | 644861 |
| 06 Plan de pruebas gestion financiera.docx | `1OEc8DBfyhsHdxRw4UgP4Vy9_kO0XuPOd` | 2026-11-03 | 602095 |
| 07 Plan de pruebas gestion de socios.docx | `1jQOuy486AoUBCNJG0xOM_cSXdrpAvI6P` | 2026-11-03 | 443505 |
| 08 Plan de pruebas gestion de pagos.docx | `13Tilw0JEzr7Bt1KZ5jQABaB3GfRf1urV` | 2026-11-03 | 572869 |

## Plantillas (`plantillas/`)

- No están en Drive: las búsquedas por título y por texto no las encontraron.
- Se copiaron de `C:\Users\ne\Downloads\`, donde se guardaron el 2026-11-05 entre las 15:16 y las 15:17.
- Son las "estructuras adjuntas" que cita el PLAN §5 L5. Que sean la versión final es NO VERIFICADO: confírmalo, Samuel.

| Archivo | Bytes |
|---|---|
| Formato_Plan_de_Pruebas.docx | 46187 |
| Manual_de_Usuario_Estructura.docx | 40334 |
| Manual_Tecnico_Estructura.docx | 36934 |
| Manual_de_Instalacion_Estructura.docx | 40764 |

## Otros planes encontrados (no copiados, falta decidir)

El PLAN §1.2 dice que en Drive faltan los planes de compras, jersey, categorías, proveedores, inventario, cartera, asistencia y landing. Hay dos juegos de 16 planes (01 a 16) que los incluyen:

- Drive, carpeta `19z42uT118IwvaTa-wYpVJ1CIRH7c77Lo`: el dueño es otra cuenta (un compañero de equipo) y los archivos están modificados el 2026-10-29. Ejemplos: `09_Plan_de_Pruebas_Gestion_de_compras.docx` (`1Bnfn0e37oYh49ND9LYGLsDIXjUH7vrOw`) y `16_Plan_de_Pruebas_Gestion_de_landing_page.docx` (`1nsVLz6sLFprJbkpALE6r97xUgo_GWAqK`).
- En disco: `C:\Users\ne\Desktop\Plan  de prueba definitivo\`, 16 archivos con fecha del 2026-10-29.

Los tamaños no coinciden entre los dos juegos, ni con los 8 oficiales (por ejemplo, el 05 de usuario: 644861 en la carpeta oficial, 331608 en Drive del compañero y 500712 en disco).

Decisión de Samuel (2026-11-05): **ninguno de los dos juegos está vigente.** Solo valen los 8 de `planes/`. Los planes 09 a 16 siguen pendientes para T4.
