'use client'

import { CHAT_ID } from '@/lib/constants'
import { useChat } from 'ai/react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
import { ExtendedMessage, ImageData } from '@/lib/types/messages'
import { saveChat } from '@/lib/actions/chat'
import { useThinkMode } from './think-mode-toggle'

export function Chat({
  id,
  savedMessages = [],
  query
}: {
  id: string
  savedMessages?: ExtendedMessage[]
  query?: string
}) {
  const { getModelId } = useThinkMode()
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    stop,
    append,
    data,
    setData,
    reload
  } = useChat({
    initialMessages: savedMessages,
    id: CHAT_ID,
    body: {
      id,
      model: getModelId()
    },
    onFinish: () => {
      window.history.replaceState({}, '', `/search/${id}`)
    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`)
    },
    sendExtraMessageFields: true, // Enable extra message fields for images
    onResponse: (response) => {
      // Log the model being used from the response headers
      const model = response.headers.get('x-model-used') || getModelId()
      console.log('🤖 Using AI Model:', model)
    }
  })

  useEffect(() => {
    if (id && savedMessages.length > 0) {
      setMessages(savedMessages)
    }
  }, [id, savedMessages, setMessages])

  const onQuerySelect = (query: string) => {
    append({
      role: 'user',
      content: query
    })
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    // Get images if they exist
    const imageBase64s = formData.getAll('images[]').map(img => {
      if (typeof img === 'string') {
        try {
          return JSON.parse(img) as ImageData
        } catch {
          return null
        }
      }
      return null
    }).filter(Boolean) as ImageData[]
    
    setData(undefined) // reset data to clear tool call
    
    // Format content for AI with images
    const formattedContent = []
    
    // Add text content if exists
    if (input.trim()) {
      formattedContent.push({
        type: 'text',
        text: input
      })
    }
    
    // Add images in proper format
    if (imageBase64s.length > 0) {
      imageBase64s.forEach(img => {
        formattedContent.push({
          type: 'file',
          data: img.data,
          mimeType: img.mimeType
        })
      })
    }
    
    // Append message with formatted content
    append({
      role: 'user',
      content: formattedContent.length === 0 ? 'Please analyze these images.' : formattedContent,
      images: imageBase64s.length > 0 ? imageBase64s : undefined
    } as ExtendedMessage)

    // Clear the input after sending
    handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLTextAreaElement>)
  }

  const handleDeleteMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) return

    // Find the related user message (the one before this assistant message)
    const userMessageIndex = messageIndex - 1
    if (userMessageIndex >= 0 && messages[userMessageIndex].role === 'user') {
      // Remove both the assistant message and its related user message
      const newMessages = messages.filter((_, index) => 
        index !== messageIndex && index !== userMessageIndex
      )
      setMessages(newMessages)
      
      // Save the updated messages to Redis
      try {
        await saveChat({
          id,
          messages: newMessages,
          createdAt: new Date(),
          userId: 'anonymous',
          path: `/search/${id}`,
          title: typeof newMessages[0]?.content === 'string' 
            ? newMessages[0].content 
            : Array.isArray(newMessages[0]?.content)
            ? (newMessages[0].content as Array<{type: string, text?: string}>).find(c => c.type === 'text')?.text || 'New Chat'
            : (newMessages[0]?.content as {text?: string})?.text || 'New Chat'
        })
      } catch (error) {
        console.error('Failed to save chat after delete:', error)
        toast.error('Failed to save changes to history')
      }
    }
  }

  const handleRegenerateMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) return

    // Remove only the assistant message
    const newMessages = messages.filter((_, index) => index !== messageIndex)
    setMessages(newMessages)
    
    // Save the updated messages to Redis before reloading
    try {
      await saveChat({
        id,
        messages: newMessages,
        createdAt: new Date(),
        userId: 'anonymous',
        path: `/search/${id}`,
        title: typeof newMessages[0]?.content === 'string' 
          ? newMessages[0].content 
          : Array.isArray(newMessages[0]?.content)
          ? (newMessages[0].content as Array<{type: string, text?: string}>).find(c => c.type === 'text')?.text || 'New Chat'
          : (newMessages[0]?.content as {text?: string})?.text || 'New Chat'
      })
    } catch (error) {
      console.error('Failed to save chat after regenerate:', error)
      toast.error('Failed to save changes to history')
    }
    
    // Reload will automatically regenerate a response for the last user message
    reload()
  }

  const handleStop = async () => {
    // Stop the AI stream first
    stop()
    
    // Get the last message (which is the one being streamed)
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === 'assistant') {
      // Save the current state of messages to Redis immediately
      try {
        await saveChat({
          id,
          messages,
          createdAt: new Date(),
          userId: 'anonymous',
          path: `/search/${id}`,
          title: typeof messages[0]?.content === 'string' 
            ? messages[0].content 
            : Array.isArray(messages[0]?.content)
            ? (messages[0].content as Array<{type: string, text?: string}>).find(c => c.type === 'text')?.text || 'New Chat'
            : (messages[0]?.content as {text?: string})?.text || 'New Chat'
        })
        
        // Instead of reloading the page, just update the URL to stay on the current chat
        window.history.replaceState({}, '', `/search/${id}`)
      } catch (error) {
        console.error('Failed to save chat after stop:', error)
        toast.error('Failed to save changes to history')
      }
    }
  }

  return (
    <div className="flex flex-col w-full max-w-3xl pt-14 pb-60 mx-auto stretch">
      <ChatMessages
        messages={messages as ExtendedMessage[]}
        data={data}
        onQuerySelect={onQuerySelect}
        isLoading={isLoading}
        chatId={id}
        onDeleteMessage={handleDeleteMessage}
        onRegenerateMessage={handleRegenerateMessage}
      />
      <ChatPanel
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={onSubmit}
        isLoading={isLoading}
        messages={messages}
        setMessages={setMessages}
        stop={handleStop}
        query={query}
        append={append}
      />
    </div>
  )
}
