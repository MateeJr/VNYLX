'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Chat } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { deleteChat } from '@/lib/actions/chat'
import { useTransition } from 'react'
import { toast } from 'sonner'

type HistoryItemProps = {
  chat: Chat
}

const formatDateWithTime = (date: Date | string) => {
  const parsedDate = new Date(date)
  const now = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (
    parsedDate.getDate() === now.getDate() &&
    parsedDate.getMonth() === now.getMonth() &&
    parsedDate.getFullYear() === now.getFullYear()
  ) {
    return `Today, ${formatTime(parsedDate)}`
  } else if (
    parsedDate.getDate() === yesterday.getDate() &&
    parsedDate.getMonth() === yesterday.getMonth() &&
    parsedDate.getFullYear() === yesterday.getFullYear()
  ) {
    return `Yesterday, ${formatTime(parsedDate)}`
  } else {
    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
}

const HistoryItem: React.FC<HistoryItemProps> = ({ chat }) => {
  const pathname = usePathname()
  const isActive = pathname === chat.path
  const [isPending, startTransition] = useTransition()

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    startTransition(async () => {
      try {
        const result = await deleteChat(chat.id)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success('Chat deleted')
        }
      } catch (error) {
        toast.error('Failed to delete chat')
      }
    })
  }

  return (
    <Link
      href={chat.path}
      className={cn(
        'flex items-center justify-between hover:bg-muted cursor-pointer p-2 rounded border group',
        isActive ? 'bg-muted/70 border-border' : 'border-transparent'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate select-none">
          {chat.title}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDateWithTime(chat.createdAt)}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive transition-colors"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Link>
  )
}

export default HistoryItem
