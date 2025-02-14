'use client'

import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { UserCircle2 } from 'lucide-react'
import { getCookie, deleteCookie } from '@/lib/utils/cookies'

export function AccountButton() {
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const name = getCookie('user-name')
    setUserName(name)
  }, [])

  const handleLogout = () => {
    deleteCookie('user-name')
    setUserName(null)
    window.location.reload() // Reload to show the name input dialog
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <UserCircle2 className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Account menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm font-medium">
          {userName || 'Guest'}
        </div>
        <DropdownMenuItem onClick={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 