import { Message } from 'ai'
import { callChat } from '@/lib/model/chat'

export async function generateTitle(messages: Message[], model: string): Promise<string> {
  try {
    const prompt = `Based on the conversation below, generate a concise and meaningful title (max 50 characters) that captures the main topic or purpose of this chat. Only respond with the title, nothing else.

Conversation:
${messages.map(m => `${m.role.toUpperCase()}: ${typeof m.content === 'string' ? m.content : (m.content as {text?: string}).text || ''}`).join('\n')}
`

    const response = await callChat({
      messages: [{ role: 'user', content: prompt }],
      model
    })

    return response.messages[0].content.slice(0, 50) || 'New Chat'
  } catch (error) {
    console.error('Error generating title:', error)
    return 'New Chat'
  }
} 