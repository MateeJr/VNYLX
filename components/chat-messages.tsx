import { JSONValue } from 'ai'
import { useEffect, useMemo, useRef, useState } from 'react'
import { RenderMessage } from './render-message'
import { ToolSection } from './tool-section'
import { Spinner } from './ui/spinner'
import { ExtendedMessage } from '@/lib/types/messages'
import { ThinkingSection } from './thinking-section'
import { useThinkMode } from './think-mode-toggle'

interface ChatMessagesProps {
  messages: ExtendedMessage[]
  data: JSONValue[] | undefined
  onQuerySelect: (query: string) => void
  isLoading: boolean
  chatId?: string
  onDeleteMessage: (messageId: string) => void
  onRegenerateMessage: (messageId: string) => void
}

export function ChatMessages({
  messages,
  data,
  onQuerySelect,
  isLoading,
  chatId,
  onDeleteMessage,
  onRegenerateMessage
}: ChatMessagesProps) {
  const { isThinkMode } = useThinkMode()
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({})
  const [thinkingTimes, setThinkingTimes] = useState<Record<string, { start: number, end?: number }>>({})
  const manualToolCallId = 'manual-tool-call'

  // Add ref for the messages container
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Combined scroll effect
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    const shouldScroll = 
      !lastMessage || // Initial mount
      (lastMessage.role === 'assistant' && isLoading) || // During streaming
      messages.length === 1 // First message
    
    if (shouldScroll) {
      scrollToBottom()
    }
  }, [messages, isLoading])

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'user') {
      setOpenStates({ [manualToolCallId]: true })
    }
  }, [messages])

  // Track thinking time for messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    const prevMessage = messages[messages.length - 2]
    
    // Only update if we really need to
    if (lastMessage?.role === 'user' && isLoading && isThinkMode) {
      const messageId = lastMessage.id
      if (!thinkingTimes[messageId]?.start) {
        setThinkingTimes(prev => ({
          ...prev,
          [messageId]: { start: Date.now() }
        }))
      }
    } else if (lastMessage?.role === 'assistant' && !isLoading && prevMessage?.role === 'user') {
      const prevMessageId = prevMessage.id
      if (thinkingTimes[prevMessageId]?.start && !thinkingTimes[prevMessageId]?.end) {
        setThinkingTimes(prev => ({
          ...prev,
          [prevMessageId]: {
            start: prev[prevMessageId].start,
            end: Date.now()
          }
        }))
      }
    }
  }, [messages, isLoading, isThinkMode, thinkingTimes])

  // get last tool data for manual tool call
  const lastToolData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null

    const lastItem = data[data.length - 1] as {
      type: 'tool_call'
      data: {
        toolCallId: string
        state: 'call' | 'result'
        toolName: string
        args: string
      }
    }

    if (lastItem.type !== 'tool_call') return null

    const toolData = lastItem.data
    return {
      state: 'call' as const,
      toolCallId: toolData.toolCallId,
      toolName: toolData.toolName,
      args: toolData.args ? JSON.parse(toolData.args) : undefined
    }
  }, [data])

  if (!messages.length) return null

  const lastUserIndex =
    messages.length -
    1 -
    [...messages].reverse().findIndex(msg => msg.role === 'user')

  const showLoading = isLoading && messages[messages.length - 1].role === 'user'

  const getIsOpen = (id: string) => {
    const baseId = id.endsWith('-related') ? id.slice(0, -8) : id
    const index = messages.findIndex(msg => msg.id === baseId)
    return openStates[id] ?? index >= lastUserIndex
  }

  const handleOpenChange = (id: string, open: boolean) => {
    setOpenStates(prev => ({
      ...prev,
      [id]: open
    }))
  }

  return (
    <div className="relative mx-auto px-4 w-full">
      {messages.map((message, index) => (
        <div key={message.id} className="mb-4 flex flex-col gap-4">
          <RenderMessage
            message={message}
            messageId={message.id}
            getIsOpen={getIsOpen}
            onOpenChange={handleOpenChange}
            onQuerySelect={onQuerySelect}
            chatId={chatId}
            onDelete={message.role === 'assistant' ? () => onDeleteMessage(message.id) : undefined}
            onRegenerate={message.role === 'assistant' ? () => onRegenerateMessage(message.id) : undefined}
          />
          {message.role === 'user' && thinkingTimes[message.id] && (
            <ThinkingSection
              isOpen={getIsOpen(`${message.id}-thinking`)}
              onOpenChange={open => handleOpenChange(`${message.id}-thinking`, open)}
              startTime={thinkingTimes[message.id].start}
              endTime={thinkingTimes[message.id].end}
              isActive={isLoading && index === messages.length - 1}
            />
          )}
        </div>
      ))}
      {showLoading && (
        <>
          {lastToolData && (
            <ToolSection
              key={manualToolCallId}
              tool={lastToolData}
              isOpen={getIsOpen(manualToolCallId)}
              onOpenChange={open => handleOpenChange(manualToolCallId, open)}
            />
          )}
          {!lastToolData && !isThinkMode && <Spinner />}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
