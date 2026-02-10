# Configuración del Logo

## Pasos para agregar el logo del club:

### 1. Preparar la imagen
- Formato recomendado: PNG con fondo transparente
- Tamaño mínimo: 256x256 píxeles
- Tamaño máximo: 512x512 píxeles
- Nombre sugerido: `club-logo.png`

### 2. Subir la imagen
- Colocar el archivo en `/images/logo/club-logo.png`

### 3. Activar el logo en el código
- Abrir el archivo `/components/Logo.tsx`
- Cambiar la línea:
  ```tsx
  const hasLogo = false // Cambiar a true cuando tengas un logo
  ```
  Por:
  ```tsx
  const hasLogo = true // Logo activado
  ```

### 4. Personalizar la ruta (opcional)
Si el archivo tiene un nombre diferente, cambiar:
```tsx
const logoPath = '/images/logo/club-logo.png'
```

### 5. Verificar la visualización
- El logo aparecerá automáticamente en:
  - Header de la aplicación
  - Pantalla de inicio de sesión
  - Cualquier lugar donde se use el componente `<Logo />`

## Formatos alternativos

### SVG (Recomendado para logos vectoriales)
Si tienes un logo en SVG:
1. Guardar como `/images/logo/club-logo.svg`
2. Actualizar la ruta en el componente Logo
3. Usar `<img>` en lugar de `ImageWithFallback` si es necesario

### Múltiples tamaños
Para optimización, puedes incluir varios tamaños:
- `club-logo-small.png` (64x64)
- `club-logo-medium.png` (128x128) 
- `club-logo-large.png` (512x512)

Y actualizar el componente Logo para usar el tamaño apropiado según el contexto.