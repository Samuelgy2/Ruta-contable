"""Comprobador de L2a: cada tabla de 0000_baseline.sql tiene su sección completa en bd-estandar.md.

Uso: python docs/bd/check_bd_estandar.py   (desde la raíz del repo; sale con 1 si falla)
"""
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
tablas = set(re.findall(r"^CREATE TABLE public\.(\w+)", (RAIZ / "backend/migrations/0000_baseline.sql").read_text(encoding="utf-8"), re.M))
doc = (RAIZ / "docs/bd/bd-estandar.md").read_text(encoding="utf-8")
secciones = dict(re.findall(r"^### (\w+)\n(.*?)(?=^### |^## |\Z)", doc, re.M | re.S))

errores = [f"falta sección: {t}" for t in sorted(tablas - secciones.keys())]
errores += [f"sección de tabla inexistente: {t}" for t in sorted(secciones.keys() - tablas)]
for t in sorted(tablas & secciones.keys()):
    for campo in ("Filas:", "Código:", "RLS:", "Comentario:"):
        if campo not in secciones[t]:
            errores.append(f"{t}: falta '{campo}'")

print(f"tablas en baseline: {len(tablas)}, secciones: {len(secciones)}")
print("\n".join(errores) or "OK")
sys.exit(1 if errores else 0)
