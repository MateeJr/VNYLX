'use client'

import { cn } from '@/lib/utils'
import { Brain } from 'lucide-react'
import { useState } from 'react'
import { Toggle } from './ui/toggle'

export function ThinkModeToggle() {
  const [isThinkMode, setIsThinkMode] = useState(false)

  const handleThinkModeChange = (pressed: boolean) => {
    setIsThinkMode(pressed)
  }

  return (
    <Toggle
      aria-label="Toggle think mode"
      pressed={false}
      disabled={true}
      variant="outline"
      className={cn(
        'gap-1 px-3 border border-input text-muted-foreground bg-background',
        'data-[state=on]:bg-accent-blue',
        'data-[state=on]:text-accent-blue-foreground',
        'data-[state=on]:border-accent-blue-border',
        'hover:bg-accent hover:text-accent-foreground rounded-full'
      )}
    >
      <Brain className="size-4" />
      <span className="text-xs">Think (soon)</span>
    </Toggle>
  )
} 