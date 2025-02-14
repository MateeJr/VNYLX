'use client'

import { cn } from '@/lib/utils'
import { getCookie, setCookie } from '@/lib/utils/cookies'
import { Globe, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Toggle } from './ui/toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SearchModeToggle() {
  const [isSearchMode, setIsSearchMode] = useState(true)
  const [isDeepSearch, setIsDeepSearch] = useState(false)

  useEffect(() => {
    const savedMode = getCookie('search-mode')
    const savedDeepMode = getCookie('deep-search-mode')
    if (savedMode !== null) {
      setIsSearchMode(savedMode === 'true')
    }
    if (savedDeepMode !== null) {
      setIsDeepSearch(savedDeepMode === 'true')
    }
  }, [])

  const handleSearchModeChange = (pressed: boolean) => {
    setIsSearchMode(pressed)
    setCookie('search-mode', pressed.toString())
  }

  const handleDeepSearchChange = (deep: boolean) => {
    setIsDeepSearch(deep)
    setCookie('deep-search-mode', deep.toString())
    setIsSearchMode(true)
    setCookie('search-mode', 'true')
  }

  return (
    <div className="flex items-center">
      <Toggle
        aria-label="Toggle search mode"
        pressed={isSearchMode}
        onPressedChange={handleSearchModeChange}
        variant="outline"
        className={cn(
          'gap-1 px-3 border border-input text-muted-foreground bg-background',
          'data-[state=on]:bg-accent-blue',
          'data-[state=on]:text-accent-blue-foreground',
          'data-[state=on]:border-accent-blue-border',
          'hover:bg-accent hover:text-accent-foreground rounded-l-full rounded-r-none'
        )}
      >
        <Globe className="size-4" />
        <span className="text-xs">{isDeepSearch ? 'Deep Search' : 'Search'}</span>
      </Toggle>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'h-9 px-2 border border-l-0 border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-r-full',
              isSearchMode && 'bg-accent-blue text-accent-blue-foreground border-accent-blue-border'
            )}
          >
            <ChevronDown className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleDeepSearchChange(false)}>
            Search
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDeepSearchChange(true)}>
            Deep Search
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
