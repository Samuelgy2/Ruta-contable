"""Comprobador de la matriz v2 (paso 2 del plan posterior a G1).

Uso:  python scripts/check_matriz.py [matriz_v2.xlsx] [brechas.csv]
Sale con 0 si todo está bien; con 1 e imprime los problemas si no.

Reglas:
- Ningún número de RF o RNF se repite.
- Ninguna celda de ninguna hoja vale "X" ni contiene "51/66".
- Todo RF tiene descripción y un "Estado en v2" válido; un "Reemplazado por RF-xxx"
  apunta a un RF vigente o nuevo.
- Todo id de brechas.csv aparece en la matriz v2 (los RF retirados, reemplazados o
  fuera de alcance siguen ahí, marcados). Las filas MOD-* deben citar en su nota el
  RF nuevo ("Matriz v2: RF-xxx") y ese RF debe existir.
"""
import csv
import re
import sys
from collections import Counter
from pathlib import Path

import openpyxl

RAIZ = Path(__file__).resolve().parent.parent
VIGENTES = {"Vigente", "Vigente (modificado)", "Nuevo en v2"}
OTROS = {"Retirado (D7)", "Fuera de alcance v1.0", "Pendiente decisión de Samuel"}
REEMPLAZO = re.compile(r"Reemplazado por (RF-\d{3})")


def norm(v):
    m = re.fullmatch(r"\s*(RN?F)\s*-\s*(\d{1,3})\s*", str(v or ""))
    return f"{m.group(1)}-{int(m.group(2)):03d}" if m else None


def revisar(matriz: Path, brechas: Path) -> list[str]:
    problemas = []
    wb = openpyxl.load_workbook(matriz, data_only=True)

    for ws in wb.worksheets:
        for fila in ws.iter_rows():
            for c in fila:
                v = c.value
                if v is None:
                    continue
                s = str(v).strip()
                if s.upper() == "X" or "51/66" in s:
                    problemas.append(f"{ws.title}!{c.coordinate}: celda suelta '{s}'")

    rf = wb["RF"]
    estados, descripciones, ids = {}, {}, []
    for r in range(10, rf.max_row + 1):
        i = norm(rf.cell(r, 3).value)
        if i and i.startswith("RF-"):
            ids.append(i)
            estados[i] = str(rf.cell(r, 10).value or "").strip()
            descripciones[i] = str(rf.cell(r, 4).value or "").strip()
    for i, n in Counter(ids).items():
        if n > 1:
            problemas.append(f"{i}: aparece {n} veces en la hoja RF")
    for i, e in estados.items():
        if not descripciones[i]:
            problemas.append(f"{i}: sin descripción")
        m = REEMPLAZO.fullmatch(e)
        if m:
            destino = m.group(1)
            if estados.get(destino) not in VIGENTES:
                problemas.append(f"{i}: reemplazado por {destino}, que no existe o no está vigente ('{estados.get(destino)}')")
        elif e not in VIGENTES | OTROS:
            problemas.append(f"{i}: 'Estado en v2' inválido o vacío ('{e}')")

    rnf_ids = [norm(wb["RNF"].cell(r, 1).value) for r in range(1, wb["RNF"].max_row + 1)]
    rnf_ids = [i for i in rnf_ids if i]
    for i, n in Counter(rnf_ids).items():
        if n > 1:
            problemas.append(f"{i}: aparece {n} veces en la hoja RNF")

    with brechas.open(encoding="utf-8", newline="") as f:
        for fila in csv.DictReader(f):
            i = fila["rf"].strip()
            if i.startswith("RF-"):
                if i not in estados:
                    problemas.append(f"brechas {i}: no está en la matriz v2")
            elif i.startswith("RNF-"):
                if i not in rnf_ids:
                    problemas.append(f"brechas {i}: no está en la hoja RNF de la matriz v2")
            elif i.startswith("MOD-"):
                m = re.search(r"Matriz v2: (RF-\d{3})", fila["nota"])
                if not m or m.group(1) not in estados:
                    problemas.append(f"brechas {i}: la nota no cita un RF existente de la matriz v2 ('Matriz v2: RF-xxx')")
            else:
                problemas.append(f"brechas {i}: id no reconocido")
    return problemas


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    args = [Path(a) for a in sys.argv[1:]]
    matriz = args[0] if len(args) > 0 else RAIZ / "docs/matriz/matriz_v2.xlsx"
    brechas = args[1] if len(args) > 1 else RAIZ / "docs/alineacion/brechas.csv"
    problemas = revisar(matriz, brechas)
    if problemas:
        print(f"FALLA: {len(problemas)} problema(s)")
        for p in problemas:
            print("  -", p)
        return 1
    print("OK: matriz v2 sin números repetidos ni celdas sueltas; todo id de brechas.csv está en la matriz")
    return 0


if __name__ == "__main__":
    sys.exit(main())
