'use client'

import { CHAT_ID } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useChat } from 'ai/react'
import { Copy, Trash2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { ChatShare } from './chat-share'
import { Button } from './ui/button'

interface MessageActionsProps {
  message: string
  chatId?: string
  enableShare?: boolean
  className?: string
  onDelete?: () => void
  onRegenerate?: () => void
}

export function MessageActions({
  message,
  chatId,
  enableShare,
  className,
  onDelete,
  onRegenerate
}: MessageActionsProps) {
  const { isLoading } = useChat({
    id: CHAT_ID
  })
  
  async function handleCopy() {
    await navigator.clipboard.writeText(message)
    toast.success('Message copied to clipboard')
  }

  function handleDelete() {
    if (onDelete) {
      onDelete()
      toast.success('Message deleted')
    }
  }

  function handleRegenerate() {
    if (onRegenerate) {
      onRegenerate()
      toast.success('Regenerating response...')
    }
  }

  if (isLoading) {
    return <div className="size-10" />
  }

  return (
    <div className={cn('flex items-center gap-0.5 self-end', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="rounded-full"
      >
        <Copy size={14} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="rounded-full"
        disabled={!onDelete}
      >
        <Trash2 size={14} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRegenerate}
        className="rounded-full"
        disabled={!onRegenerate}
      >
        <RefreshCw size={14} />
      </Button>
      {enableShare && chatId && <ChatShare chatId={chatId} />}
    </div>
  )
}
