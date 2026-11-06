# Pendientes de T3 hacia otras terminales

## Para T1 (brechas.csv y matriz v2)

- Contradicción plan↔código: el plan (§1.5) dice "bloqueo tras 5 intentos fallidos" HECHO. `backend/routes/auth.js:54-61` guarda `locked_until` pero el login nunca lo comprueba (`auth.js:41-65`). Registrar en `brechas.csv` con acción AJUSTAR_CODIGO (T3 lo corrige en fase 2). Evidencia completa en `docs/alineacion/seguridad.md`, control 6.
- RNF-009 (notificar errores y caídas): no implementado (control 8). Decidir en matriz v2: implementar o redactar como limitación v1.0.
- RNF-007 (logs): solo existe registro de logins fallidos (control 7). Acotar el texto del RNF a lo real o ampliar el código.
- RNF-010: bcrypt existe en `auth`, `AuthController` y `forgotPassword` (coste 12 en login/registro, 10 para el OTP). Redactar con el algoritmo real.

## Para Samuel (decisiones y accesos)

- Rotación de secretos (control 1): Samuel decidió NO rotar por tiempo (5 nov). Riesgo aceptado y registrado; `git rm --cached` de los 5 archivos hecho (5 nov, autorizado), pendiente de commit. T4: mencionar la limitación en el Manual Técnico (sección de seguridad).
- Visibilidad del repo en GitHub (control 1) y variables en Render/Vercel (control 10).
- Controles 8 y 12: implementar o documentar como limitación.

## Para T1 (infraestructura de ramas)

- No existen worktrees `rc-t3` ni ramas `entrega/*`. T3 escribió `docs/alineacion/seguridad.md` y este archivo en el árbol principal (rama `feature/landing-editable`), ambos sin commitear.
