import { ImageWithFallback } from '../figma/ImageWithFallback'
import clubLogo from '@/images/logo/club-logo.png'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
  showPlaceholder?: boolean
}

export function Logo({ size = 'medium', className = '', showPlaceholder = true }: LogoProps) {
  const sizes = {
    small: 'w-8 h-8',
    medium: 'w-15 h-15', // 60px
    large: 'w-20 h-20'
  }

  const placeholderSizes = {
    small: 'text-xs',
    medium: 'text-xs',
    large: 'text-sm'
  }

  // Logo imported as Vite asset
  const hasLogo = true

  if (hasLogo) {
    return (
      <div className={`${sizes[size]} ${className}`}>
        <ImageWithFallback
          src={clubLogo}
          alt="Logo del Club"
          className="w-full h-full object-contain rounded-xl"
        />
      </div>
    )
  }

  if (showPlaceholder) {
    return (
      <div className={`${sizes[size]} ${className}`}>
        <div className={`w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 font-medium transition-all duration-200 hover:border-green-500 hover:text-green-500 ${placeholderSizes[size]}`}>
          LOGO
        </div>
      </div>
    )
  }

  return null
}
