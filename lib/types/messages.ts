import { Message } from 'ai'

export interface ImageData {
  data: string
  mimeType: string
}

export interface ExtendedMessage extends Message {
  images?: ImageData[]
}

export type { Message } 