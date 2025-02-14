'use client'

import { cn } from '@/lib/utils'

function IconLogo({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 256 256"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <circle cx="128" cy="128" r="128" fill="black"></circle>
      <text
        x="128"
        y="148"
        fill="white"
        fontSize="80"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        V
      </text>
    </svg>
  )
}

export { IconLogo }

