#!/usr/bin/env python3
"""Comprobador de planes de prueba (L4). Solo biblioteca estándar.

Revisa un plan .docx armado con Formato_Plan_de_Pruebas.docx:
  1. Cada RF indicado aparece en al menos un caso de la tabla del ítem 8.
  2. Cada caso tiene captura (cubierto por un grupo de figuras) o justificación
     escrita en la sección de evidencias.
  3. No quedan corchetes de plantilla (se aceptan las casillas "[ ]" y "[X]"),
     ni líneas de subrayado, ni el texto "Ejemplo:".
  4. Los IDs de caso son únicos, comparten prefijo y cada uno está en el
     registro de ejecución (ítem 9).

Uso:
  python scripts/check_plan.py PLAN.docx --rf RF-042,RF-043,RF-065:RF-068
  python scripts/check_plan.py PLAN.docx --matriz docs/fuentes/matriz_rf_plano.csv --proceso Categoria --rf RF-042,RF-043

Con --matriz y --proceso se agregan al conjunto los RF de ese proceso.
Código de salida 0 si todo pasa, 1 si algo falla.
"""
import argparse
import csv
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def texto(el):
    partes = []
    for nodo in el.iter():
        if nodo.tag == W + "t" and nodo.text:
            partes.append(nodo.text)
        elif nodo.tag == W + "br":
            partes.append("\n")
        elif nodo.tag == W + "tab":
            partes.append(" ")
    return "".join(partes)


def leer(ruta):
    with zipfile.ZipFile(ruta) as z:
        raiz = ET.fromstring(z.read("word/document.xml"))
    cuerpo = raiz.find(W + "body")
    bloques = []  # ("p", texto, estilo) | ("t", [[celdas...]...])
    for hijo in cuerpo:
        if hijo.tag == W + "p":
            estilo = hijo.find(f"{W}pPr/{W}pStyle")
            bloques.append(("p", texto(hijo), estilo.get(W + "val") if estilo is not None else ""))
        elif hijo.tag == W + "tbl":
            filas = []
            for tr in hijo.findall(W + "tr"):
                filas.append([texto(tc).strip() for tc in tr.findall(W + "tc")])
            bloques.append(("t", filas))
    return bloques


def expandir_rf(valor):
    salida = []
    for trozo in valor.split(","):
        trozo = trozo.strip()
        if not trozo:
            continue
        m = re.fullmatch(r"RF-(\d{3}):RF-(\d{3})", trozo)
        if m:
            salida += [f"RF-{n:03d}" for n in range(int(m.group(1)), int(m.group(2)) + 1)]
        elif re.fullmatch(r"RF-\d{3}", trozo):
            salida.append(trozo)
        else:
            sys.exit(f"RF no válido: {trozo}")
    return salida


def rf_de_proceso(ruta, proceso):
    with open(ruta, encoding="utf-8-sig", newline="") as f:
        lector = csv.DictReader(f)
        campos = lector.fieldnames or []
        col_id = next((c for c in campos if c.lower() in ("rf", "id", "id_rf", "nro")), campos[0])
        col_proceso = next((c for c in campos if c.lower() == "proceso"), None)
        if col_proceso is None:
            sys.exit(f"{ruta}: no tiene columna Proceso (columnas: {campos})")
        return [fila[col_id].strip() for fila in lector
                if fila[col_proceso].strip().lower() == proceso.strip().lower()]


def ids_cubiertos(prefijo, texto_evidencias):
    """Lee referencias como 'CP-CAT-01 a CP-CAT-06', 'CP-CAT-07, 08 y 11 a 20' o 'CP-CAT-32'."""
    cubiertos = set()
    patron = re.compile(rf"{prefijo}-(\d+)((?:\s*(?:,|y|a)\s*(?:{prefijo}-)?\d+)*)")
    for m in patron.finditer(texto_evidencias):
        numeros = [int(m.group(1))]
        conectores = re.findall(r"(,|y|a)\s*(?:" + prefijo + r"-)?(\d+)", m.group(2))
        previo, rango = numeros[0], False
        for conector, num in conectores:
            n = int(num)
            if conector == "a":
                numeros += list(range(previo + 1, n + 1))
            else:
                numeros.append(n)
            previo = n
        cubiertos.update(numeros)
    return {f"{prefijo}-{n:02d}" for n in cubiertos}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan")
    ap.add_argument("--rf", default="", help="RF obligatorios: RF-042,RF-043,RF-065:RF-068")
    ap.add_argument("--matriz", help="matriz_rf_plano.csv")
    ap.add_argument("--proceso", help="nombre del proceso en la matriz")
    args = ap.parse_args()

    requeridos = expandir_rf(args.rf)
    if args.matriz and args.proceso:
        requeridos += rf_de_proceso(args.matriz, args.proceso)
    requeridos = sorted(set(requeridos))

    bloques = leer(args.plan)
    fallos = []

    # Tabla de casos (ítem 8) y de registro (ítem 9)
    tabla_casos = next((b[1] for b in bloques if b[0] == "t" and b[1] and b[1][0][:3] == ["ID", "Funcionalidad / requisito", "Precondiciones"]), None)
    tabla_reg = next((b[1] for b in bloques if b[0] == "t" and b[1] and b[1][0][:2] == ["Caso", "Fecha"]), None)
    if tabla_casos is None:
        sys.exit("FALLA: no se encontró la tabla de casos del ítem 8")
    casos = [f for f in tabla_casos[1:] if f and f[0].startswith("CP-")]
    ids = [f[0] for f in casos]
    print(f"Casos: {len(ids)} · RF exigidos: {len(requeridos)}")

    if len(set(ids)) != len(ids):
        fallos.append("IDs de caso repetidos: " + ", ".join(sorted({i for i in ids if ids.count(i) > 1})))
    prefijos = {re.match(r"CP-([A-Z]+)-", i).group(1) for i in ids if re.match(r"CP-([A-Z]+)-", i)}
    if len(prefijos) != 1:
        fallos.append(f"prefijos de caso no uniformes: {sorted(prefijos)}")
    prefijo = f"CP-{next(iter(prefijos))}" if prefijos else "CP-XXX"

    # 1. RF con al menos un caso
    for rf in requeridos:
        usados = [f[0] for f in casos if rf in f[1]]
        if not usados:
            fallos.append(f"{rf} sin ningún caso en el ítem 8")

    # 2. Captura o justificación
    inicio = next((i for i, b in enumerate(bloques) if b[0] == "p" and b[1].strip() == "Evidencias de pantalla de los casos"), None)
    fin = next((i for i, b in enumerate(bloques) if b[0] == "p" and b[1].strip().startswith("9.") and "Registro de ejecuci" in b[1]), None)
    if inicio is None or fin is None:
        fallos.append("no se encontró la sección 'Evidencias de pantalla de los casos'")
        cubiertos = set()
    else:
        evidencias = "\n".join(b[1] for b in bloques[inicio:fin] if b[0] == "p")
        cubiertos = ids_cubiertos(prefijo, evidencias)
        sin_figuras = len(re.findall(r"^Figura \d+\.", evidencias, flags=re.M))
        print(f"Figuras: {sin_figuras}")
    for i in ids:
        if i not in cubiertos:
            fallos.append(f"{i} sin captura ni justificación en la sección de evidencias")

    # 3. Corchetes de plantilla, subrayados, ejemplos
    todo = []
    for b in bloques:
        if b[0] == "p":
            todo.append(b[1])
        else:
            todo += [c for fila in b[1] for c in fila]
    for t in todo:
        for m in re.finditer(r"\[([^\]]*)\]", t):
            if m.group(1).strip() not in ("", "X", "x"):
                fallos.append(f"corchete de plantilla: [{m.group(1)[:50]}]")
        if re.search(r"_{8,}", t):
            fallos.append("línea de subrayado de plantilla sin rellenar")
        if "Ejemplo:" in t:
            fallos.append("texto de ejemplo de la plantilla: " + t[:60])

    # 4. Registro de ejecución
    if tabla_reg is None:
        fallos.append("no se encontró la tabla de registro de ejecución (ítem 9)")
    else:
        registrados = {f[0] for f in tabla_reg[1:] if f}
        for i in ids:
            if i not in registrados:
                fallos.append(f"{i} falta en el registro de ejecución (ítem 9)")

    if fallos:
        for f in dict.fromkeys(fallos):
            print("FALLA:", f)
        sys.exit(1)
    print("OK: todos los RF con caso, cada caso con captura o justificación, sin texto de plantilla")


if __name__ == "__main__":
    main()
