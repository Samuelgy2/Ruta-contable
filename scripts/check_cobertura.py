"""Comprobador del loop L1: cobertura de docs/alineacion/brechas.csv contra la matriz.

Uso:  python scripts/check_cobertura.py [brechas.csv] [matriz_rf_plano.csv] [matriz_rnf.csv]
Sale con 0 si todo está bien; con 1 e imprime los problemas si no.

Reglas (PLAN_ENTREGA_FINAL.md §5 L1):
- Cada RF y RNF de la matriz aparece exactamente una vez.
- Ninguna fila tiene evidencia vacía.
- estado y accion usan solo los valores permitidos.
- Una fila con un id que no está en la matriz debe tener estado FUERA_DE_MATRIZ.
"""
import csv
import re
import sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
COLUMNAS = ["rf", "proceso", "subproceso", "descripcion_matriz", "estado", "evidencia", "tabla_bd", "accion", "nota"]
ESTADOS = {"OK", "PARCIAL", "NO_IMPLEMENTADO", "DUPLICADO", "FUERA_DE_MATRIZ"}
ACCIONES = {"AJUSTAR_MATRIZ", "AJUSTAR_CODIGO", "AMBOS", "SIN_CAMBIO", "PENDIENTE_SAMUEL"}


def ids_matriz(rf_csv: Path, rnf_csv: Path) -> list[str]:
    with rf_csv.open(encoding="utf-8") as f:
        rf = [r["rf"] for r in csv.DictReader(f)]
    with rnf_csv.open(encoding="utf-8") as f:
        rnf = sorted({m for linea in f for m in re.findall(r"RNF-\d{3}", linea)})
    return rf + rnf


def revisar(brechas: Path, rf_csv: Path, rnf_csv: Path) -> list[str]:
    problemas = []
    esperados = ids_matriz(rf_csv, rnf_csv)
    if not brechas.exists():
        return [f"no existe {brechas}"]
    with brechas.open(encoding="utf-8", newline="") as f:
        lector = csv.DictReader(f)
        if lector.fieldnames != COLUMNAS:
            problemas.append(f"encabezado distinto: {lector.fieldnames} (esperado {COLUMNAS})")
            return problemas
        filas = list(lector)

    conteo = Counter(r["rf"].strip() for r in filas)
    for i in esperados:
        if conteo[i] == 0:
            problemas.append(f"{i}: falta")
        elif conteo[i] > 1:
            problemas.append(f"{i}: aparece {conteo[i]} veces")

    conjunto = set(esperados)
    for n, r in enumerate(filas, start=2):
        rf = r["rf"].strip()
        if r["estado"] not in ESTADOS:
            problemas.append(f"línea {n} ({rf}): estado inválido '{r['estado']}'")
        if r["accion"] not in ACCIONES:
            problemas.append(f"línea {n} ({rf}): accion inválida '{r['accion']}'")
        if not r["evidencia"].strip():
            problemas.append(f"línea {n} ({rf}): evidencia vacía")
        if rf not in conjunto and r["estado"] != "FUERA_DE_MATRIZ":
            problemas.append(f"línea {n} ({rf}): no está en la matriz y su estado no es FUERA_DE_MATRIZ")
    return problemas


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    args = [Path(a) for a in sys.argv[1:]]
    brechas = args[0] if len(args) > 0 else RAIZ / "docs/alineacion/brechas.csv"
    rf_csv = args[1] if len(args) > 1 else RAIZ / "docs/fuentes/matriz_rf_plano.csv"
    rnf_csv = args[2] if len(args) > 2 else RAIZ / "docs/fuentes/matriz_rnf.csv"
    problemas = revisar(brechas, rf_csv, rnf_csv)
    total = len(ids_matriz(rf_csv, rnf_csv))
    if problemas:
        faltan = sum(p.endswith(": falta") for p in problemas)
        print(f"FALLA: {len(problemas)} problema(s); faltan {faltan} de {total} requisitos")
        for p in problemas:
            print("  -", p)
        return 1
    print(f"OK: {total} requisitos cubiertos una vez, sin evidencias vacías")
    return 0


if __name__ == "__main__":
    sys.exit(main())
