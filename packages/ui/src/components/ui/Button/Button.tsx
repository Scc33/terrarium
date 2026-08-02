import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'
export type ButtonSize = 'compact' | 'standard'

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-dossier-brass bg-dossier-brass text-dossier-ink hover:bg-[#c29c61] hover:border-[#c29c61]',
  secondary:
    'border-dossier-paper/30 bg-transparent text-dossier-paper/80 hover:border-dossier-brass hover:text-dossier-brass hover:bg-dossier-paper/5',
  quiet:
    'border-dossier-ink/25 bg-transparent text-dossier-ink/70 hover:border-dossier-ink hover:bg-dossier-ink hover:text-dossier-paper',
  danger:
    'border-dossier-warn bg-transparent text-dossier-warn hover:bg-dossier-warn hover:text-dossier-paper',
}

const sizes: Record<ButtonSize, string> = {
  compact: 'min-h-7 px-2 py-1 text-[9px]',
  standard: 'min-h-9 px-3 py-2 text-[10px]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'quiet',
  size = 'standard',
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonProps, ref) {
  return (
    <button
      type={type}
      ref={ref}
      className={`inline-flex items-center justify-center border font-mono font-medium tracking-[0.16em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dossier-brass disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})
