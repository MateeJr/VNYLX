'use client'

import { cn } from '@/lib/utils'
import { Brain } from 'lucide-react'
import { createContext, useContext, useState } from 'react'
import { Toggle } from './ui/toggle'

interface ThinkModeContextType {
  isThinkMode: boolean
  setThinkMode: (value: boolean) => void
  getModelId: () => string
}

const ThinkModeContext = createContext<ThinkModeContextType>({
  isThinkMode: false,
  setThinkMode: () => {},
  getModelId: () => 'google:gemini-2.0-flash'
})

export const useThinkMode = () => useContext(ThinkModeContext)

export function ThinkModeProvider({ children }: { children: React.ReactNode }) {
  const [isThinkMode, setIsThinkMode] = useState(false)

  const getModelId = () => isThinkMode ? 'google:gemini-2.0-flash-thinking-exp-01-21' : 'google:gemini-2.0-flash'

  return (
    <ThinkModeContext.Provider value={{
      isThinkMode,
      setThinkMode: setIsThinkMode,
      getModelId
    }}>
      {children}
    </ThinkModeContext.Provider>
  )
}

export function ThinkModeToggle() {
  const { isThinkMode, setThinkMode } = useThinkMode()

  const handleThinkModeChange = (pressed: boolean) => {
    setThinkMode(pressed)
  }

  return (
    <Toggle
      aria-label="Toggle think mode"
      pressed={isThinkMode}
      onPressedChange={handleThinkModeChange}
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
      <span className="text-xs">Think (BETA)</span>
    </Toggle>
  )
}