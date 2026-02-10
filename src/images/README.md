# Carpeta de Imágenes

Esta carpeta contiene las imágenes del proyecto ClubFinance.

## Estructura

- `logo/` - Logos del club y de la aplicación
- `icons/` - Iconos personalizados
- `backgrounds/` - Imágenes de fondo
- `avatars/` - Fotos de perfil por defecto
- `documents/` - Imágenes de documentos o reportes

## Formatos Recomendados

- **Logo principal**: PNG con fondo transparente, tamaño mínimo 256x256px
- **Iconos**: SVG o PNG, tamaños múltiples (16px, 24px, 32px, 48px)
- **Imágenes de fondo**: JPG o WebP, optimizadas para web
- **Avatares**: PNG o JPG, tamaño cuadrado recomendado

## Uso

Para usar una imagen en el código:

```jsx
import logo from '/images/logo/club-logo.png'

// O usando el componente ImageWithFallback
<ImageWithFallback src="/images/logo/club-logo.png" alt="Logo del Club" />
```

## Optimización

- Comprimir imágenes antes de subirlas
- Usar formatos modernos como WebP cuando sea posible
- Considerar lazy loading para imágenes grandes