'use client'

import { Brain } from 'lucide-react'
import { Section } from './section'
import { CollapsibleMessage } from './collapsible-message'
import { Badge } from './ui/badge'
import { useEffect, useState } from 'react'

interface ThinkingSectionProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  startTime: number
  endTime?: number
  isActive?: boolean
}

export function ThinkingSection({
  isOpen,
  onOpenChange,
  startTime,
  endTime,
  isActive = false
}: ThinkingSectionProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!isActive && endTime) {
      setElapsedTime(Math.floor((endTime - startTime) / 1000))
      return
    }

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, endTime, isActive])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const header = (
    <Section size="sm" className="py-0 flex items-center justify-between">
      <Badge variant="secondary" className="flex items-center gap-2 bg-muted">
        <Brain className="size-4" />
        <span>{isActive ? "Thinking..." : "Thought for"}</span>
      </Badge>
      <Badge variant="outline" className={isActive ? "text-white animate-pulse" : "text-muted-foreground"}>
        {formatTime(elapsedTime)}
      </Badge>
    </Section>
  )

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible={true}
      header={header}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Section>
        <div className="text-sm text-muted-foreground">
          {isActive ? (
            "The AI is in thinking mode, taking extra time to process and analyze your request..."
          ) : (
            "The AI took extra time in thinking mode to process and analyze this request."
          )}
        </div>
      </Section>
    </CollapsibleMessage>
  )
} 