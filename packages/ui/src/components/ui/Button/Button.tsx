import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Tooltip } from '../Tooltip/Tooltip'

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
  title,
  disabled,
  children,
  ...props
}: ButtonProps, ref) {
  const button = (
    <button
      type={type}
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center border font-mono font-medium tracking-[0.16em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dossier-brass disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
  if (title && disabled) {
    return (
      <Tooltip content={title} openOnClick>
        <span tabIndex={0} aria-label={title} className={`inline-flex ${fullWidth ? 'w-full' : ''}`}>
          {button}
        </span>
      </Tooltip>
    )
  }
  return title ? <Tooltip content={title}>{button}</Tooltip> : button
})
