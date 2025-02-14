'use client'

import { cn } from '@/lib/utils'
import { Message } from 'ai'
import { ArrowUp, ImageIcon, MessageCirclePlus, Square, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { EmptyScreen } from './empty-screen'
import { ModelSelector } from './model-selector'
import { SearchModeToggle } from './search-mode-toggle'
import { ThinkModeToggle } from './think-mode-toggle'
import { Button } from './ui/button'
import { IconLogo } from './ui/icons'
import { ImageData } from '@/lib/types/messages'
import { toast } from 'sonner'
import Link from 'next/link'
import { SiInstagram, SiWhatsapp } from 'react-icons/si'

interface ChatPanelProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  messages: Message[]
  setMessages: (messages: Message[]) => void
  query?: string
  stop: () => void
  append: (message: any) => void
}

interface AttachedImage {
  file: File
  preview: string
  compressedData: string
  compressedMimeType: string
}

const MAX_IMAGE_SIZE = 800 // Maximum width/height in pixels
const JPEG_QUALITY = 0.7 // JPEG quality (0.0 to 1.0)

async function compressImage(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_IMAGE_SIZE) {
            height = Math.round((height * MAX_IMAGE_SIZE) / width)
            width = MAX_IMAGE_SIZE
          }
        } else {
          if (height > MAX_IMAGE_SIZE) {
            width = Math.round((width * MAX_IMAGE_SIZE) / height)
            height = MAX_IMAGE_SIZE
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to JPEG with quality setting
        const compressedData = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
        const base64Data = compressedData.split(',')[1]

        resolve({
          data: base64Data,
          mimeType: 'image/jpeg'
        })
      }
      img.onerror = () => reject(new Error('Failed to load image'))
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function ChatPanel({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  messages,
  setMessages,
  query,
  stop,
  append
}: ChatPanelProps) {
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false)
  const [enterDisabled, setEnterDisabled] = useState(false)

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)
    setEnterDisabled(true)
    setTimeout(() => {
      setEnterDisabled(false)
    }, 300)
  }

  const handleNewChat = () => {
    setMessages([])
    router.push('/')
  }

  const handleImageAttach = () => {
    fileInputRef.current?.click()
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    // Filter for allowed image types
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']
    const validFiles = files.filter(file => allowedTypes.includes(file.type))
    
    // Limit to 4 images total
    const remainingSlots = 4 - attachedImages.length
    const filesToAdd = validFiles.slice(0, remainingSlots)
    
    try {
      // Create previews and compress images
      const newImages = await Promise.all(
        filesToAdd.map(async (file) => {
          const preview = URL.createObjectURL(file)
          const compressedImage = await compressImage(file)
          return { 
            file,
            preview,
            compressedData: compressedImage.data,
            compressedMimeType: compressedImage.mimeType
          }
        })
      )
      
      setAttachedImages(prev => [...prev, ...newImages])
    } catch (error) {
      console.error('Failed to process images:', error)
      toast.error('Failed to process one or more images')
    }
    
    // Reset input
    e.target.value = ''
  }

  const handleImageRemove = (index: number) => {
    setAttachedImages(prev => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      attachedImages.forEach(img => URL.revokeObjectURL(img.preview))
    }
  }, [attachedImages])

  // if query is not empty, submit the query
  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0) {
      append({
        role: 'user',
        content: query
      })
      isFirstRender.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    
    // Convert compressed images to base64
    const imageBase64s = attachedImages.map(img => ({
      data: img.compressedData,
      mimeType: img.compressedMimeType
    }))
    
    // Create hidden input for images
    imageBase64s.forEach((img, index) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = 'images[]'
      input.value = JSON.stringify(img)
      form.appendChild(input)
    })
    
    // Clear attached images
    attachedImages.forEach(img => URL.revokeObjectURL(img.preview))
    setAttachedImages([])
    
    // Submit with images
    handleSubmit(e)
    
    // Clean up hidden inputs
    form.querySelectorAll('input[name="images[]"]').forEach(el => el.remove())
  }

  return (
    <div
      className={cn(
        'mx-auto w-full',
        messages.length > 0
          ? 'fixed bottom-0 left-0 right-0 bg-background'
          : 'fixed bottom-8 left-0 right-0 top-6 flex flex-col items-center justify-center'
      )}
    >
      {messages.length === 0 && (
        <div className="mb-8">
          <IconLogo className="size-12 text-muted-foreground" />
        </div>
      )}
      <form
        onSubmit={handleFormSubmit}
        className={cn(
          'max-w-3xl w-full mx-auto',
          messages.length > 0 ? 'px-2 py-4' : 'px-6'
        )}
      >
        {/* Model selector and social links */}
        <div className="flex items-center justify-between mb-2">
          <ModelSelector />
          <div className="flex items-center gap-1">
            <Link href="https://instagram.com/professional_idiot_25" target="_blank">
              <Button
                variant={'ghost'}
                size={'icon'}
                className="text-muted-foreground/50"
                type="button"
              >
                <SiInstagram size={18} />
              </Button>
            </Link>
            <Link href="https://wa.me/+6285172196650" target="_blank">
              <Button
                variant={'ghost'}
                size={'icon'}
                className="text-muted-foreground/50"
                type="button"
              >
                <SiWhatsapp size={18} />
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative flex flex-col w-full gap-2 bg-muted rounded-3xl border border-input">
          {/* Image previews */}
          {attachedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2">
              {attachedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.preview}
                    alt={`Attached ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <Textarea
            ref={inputRef}
            name="input"
            rows={2}
            maxRows={5}
            tabIndex={0}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="Type your question here..."
            spellCheck={false}
            value={input}
            className="resize-none w-full min-h-12 bg-transparent border-0 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            onChange={e => {
              handleInputChange(e)
              setShowEmptyScreen(e.target.value.length === 0)
            }}
            onKeyDown={e => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !isComposing &&
                !enterDisabled
              ) {
                if (input.trim().length === 0 && attachedImages.length === 0) {
                  e.preventDefault()
                  return
                }
                e.preventDefault()
                const textarea = e.target as HTMLTextAreaElement
                textarea.form?.requestSubmit()
              }
            }}
            onFocus={() => setShowEmptyScreen(true)}
            onBlur={() => setShowEmptyScreen(false)}
          />

          {/* Bottom menu area */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <SearchModeToggle />
              <ThinkModeToggle />
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNewChat}
                  className="shrink-0 rounded-full group"
                  type="button"
                  disabled={isLoading}
                >
                  <MessageCirclePlus className="size-4 group-hover:rotate-12 transition-all" />
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="rounded-full"
                onClick={handleImageAttach}
                disabled={isLoading || attachedImages.length >= 4}
              >
                <ImageIcon size={20} />
              </Button>
              <Button
                type={isLoading ? 'button' : 'submit'}
                size={'icon'}
                variant={'outline'}
                className={cn(isLoading && 'animate-pulse', 'rounded-full')}
                disabled={(input.trim().length === 0 && attachedImages.length === 0) || isLoading}
                onClick={isLoading ? stop : undefined}
              >
                {isLoading ? <Square size={20} /> : <ArrowUp size={20} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />

        {messages.length === 0 && (
          <EmptyScreen
            submitMessage={message => {
              handleInputChange({
                target: { value: message }
              } as React.ChangeEvent<HTMLTextAreaElement>)
            }}
            className={cn(showEmptyScreen ? 'visible' : 'invisible')}
          />
        )}
      </form>
    </div>
  )
}
