import React from 'react'
import { CollapsibleMessage } from './collapsible-message'

interface ImageData {
  data: string
  mimeType: string
}

type UserMessageProps = {
  message: string | Array<{ type: string; text?: string; data?: string; mimeType?: string }>
  images?: ImageData[]
}

export const UserMessage: React.FC<UserMessageProps> = ({ message, images }) => {
  // Extract text from message if it's an array
  const displayText = Array.isArray(message) 
    ? message
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join(' ')
    : message

  return (
    <CollapsibleMessage role="user">
      <div className="flex flex-col gap-4">
        {images && images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((img, index) => (
              <img
                key={index}
                src={`data:${img.mimeType};base64,${img.data}`}
                alt={`Attached ${index + 1}`}
                className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
              />
            ))}
          </div>
        )}
        <div className="flex-1 break-words w-full">{displayText}</div>
      </div>
    </CollapsibleMessage>
  )
}
