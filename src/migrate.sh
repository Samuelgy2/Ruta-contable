#!/bin/bash

echo "🚀 Iniciando migración a arquitectura por features..."

# Crear estructura de carpetas
echo "📁 Creando estructura de carpetas..."
mkdir -p features/auth/{components,contexts,pages}
mkdir -p features/dashboard/{components,pages,contexts,hooks,utils}
mkdir -p features/landing/{components,pages}
mkdir -p shared/{components,types,utils}

# Copiar archivos de auth
echo "📦 Migrando feature: auth..."
[ -f components/auth/LoginForm.tsx ] && cp components/auth/LoginForm.tsx features/auth/components/
[ -f components/auth/RegisterForm.tsx ] && cp components/auth/RegisterForm.tsx features/auth/components/
[ -f contexts/AuthContext.tsx ] && cp contexts/AuthContext.tsx features/auth/contexts/
[ -f pages/Login.tsx ] && cp pages/Login.tsx features/auth/pages/
[ -f pages/Register.tsx ] && cp pages/Register.tsx features/auth/pages/

# Copiar archivos de dashboard
echo "📦 Migrando feature: dashboard..."
[ -f components/common/Header.tsx ] && cp components/common/Header.tsx features/dashboard/components/
[ -f components/common/StatCard.tsx ] && cp components/common/StatCard.tsx features/dashboard/components/
[ -f pages/UserDashboard.tsx ] && cp pages/UserDashboard.tsx features/dashboard/pages/
[ -f pages/AdminPanel.tsx ] && cp pages/AdminPanel.tsx features/dashboard/pages/
[ -f contexts/DataContext.tsx ] && cp contexts/DataContext.tsx features/dashboard/contexts/
[ -f hooks/useStats.ts ] && cp hooks/useStats.ts features/dashboard/hooks/
[ -f utils/export.ts ] && cp utils/export.ts features/dashboard/utils/
[ -f utils/format.ts ] && cp utils/format.ts features/dashboard/utils/
[ -f utils/validation.ts ] && cp utils/validation.ts features/dashboard/utils/

# Copiar archivos de landing
echo "📦 Migrando feature: landing..."
[ -f components/common/Navbar.tsx ] && cp components/common/Navbar.tsx features/landing/components/
[ -f components/common/Footer.tsx ] && cp components/common/Footer.tsx features/landing/components/
[ -f components/landing/Hero.tsx ] && cp components/landing/Hero.tsx features/landing/components/
[ -f components/landing/Features.tsx ] && cp components/landing/Features.tsx features/landing/components/
[ -f components/landing/About.tsx ] && cp components/landing/About.tsx features/landing/components/
[ -f components/landing/CTA.tsx ] && cp components/landing/CTA.tsx features/landing/components/
[ -f pages/LandingPage.tsx ] && cp pages/LandingPage.tsx features/landing/pages/

# Copiar archivos compartidos
echo "📦 Migrando shared..."
[ -f components/common/Logo.tsx ] && cp components/common/Logo.tsx shared/components/
[ -f components/figma/ImageWithFallback.tsx ] && cp components/figma/ImageWithFallback.tsx shared/components/
[ -f types/index.ts ] && cp types/index.ts shared/types/
[ -f utils/initialData.ts ] && cp utils/initialData.ts shared/utils/

# Eliminar carpeta supabase
echo "🗑️  Eliminando Supabase..."
rm -rf supabase
rm -rf utils/supabase

echo "✅ Migración completada!"
echo ""
echo "⚠️  IMPORTANTE: Ahora debes actualizar los imports manualmente:"
echo "   - Ver MIGRATION_GUIDE.md para detalles"
echo "   - Usar buscar/reemplazar en tu editor"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Revisar MIGRATION_GUIDE.md"
echo "   2. Actualizar imports en App.tsx"
echo "   3. Ejecutar: npm run dev"
echo "   4. Verificar que todo funcione"
