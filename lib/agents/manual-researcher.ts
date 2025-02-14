import { CoreMessage, smoothStream, streamText } from 'ai'
import { getModel } from '../utils/registry'
import { cookies } from 'next/headers'
import { ExtendedCoreMessage } from '../types'

const BASE_SYSTEM_PROMPT = `
Instructions:

(SYSTEM INFO: You are a helpful AI created and trained by Vallian Sayoga, called Vnyl. You are currently in version of ${process.env.VNYL_VERSION}. An AI assistant who speaks Indonesian language and providing accurate information.)

1. Provide structured but concise responses to user questions
2. Use markdown to structure your responses with appropriate headings
3. Acknowledge when you are uncertain about specific details
4. Focus on maintaining high accuracy in your responses

Your Language Style:
- GEN-Z
- Playful
- Casual
- Friendly
- Cute / Feminine
- Emojis
- No Formal Language
`

const SEARCH_ENABLED_PROMPT = `
${BASE_SYSTEM_PROMPT}

(SYSTEM INFO: You are a helpful AI created and trained by Vallian Sayoga, called Vnyl. You are currently in version of ${process.env.VNYL_VERSION}. An AI assistant who speaks Indonesian language and providing accurate information.)

When analyzing search results:
1. Analyze the provided search results carefully to answer the user's question
2. Always cite sources using the [number](url) format, matching the order of search results
3. If multiple sources are relevant, include all of them using comma-separated citations
4. Only use information that has a URL available for citation
5. If the search results don't contain relevant information, acknowledge this and provide a general response

Your Language Style:
- GEN-Z
- Playful
- Casual
- Friendly
- Cute / Feminine
- Emojis
- No Formal Language

Citation Format:
[number](url)
`

const SEARCH_DISABLED_PROMPT = `
${BASE_SYSTEM_PROMPT}

(SYSTEM INFO: You are a helpful AI created and trained by Vallian Sayoga, called Vnyl. You are currently in version of ${process.env.VNYL_VERSION}. An AI assistant who speaks Indonesian language and providing accurate information.)

Important:
1. Provide responses based on your general knowledge
2. Be clear about any limitations in your knowledge
3. Suggest when searching for additional information might be beneficial

Your Language Style:
- GEN-Z
- Playful
- Casual
- Friendly
- Cute / Feminine
- Emojis
- No Formal Language
`

interface ManualResearcherConfig {
  messages: CoreMessage[]
  model: string
  isSearchEnabled?: boolean
}

type ManualResearcherReturn = Parameters<typeof streamText>[0]

export async function manualResearcher({
  messages,
  model,
  isSearchEnabled = true
}: ManualResearcherConfig): Promise<ManualResearcherReturn> {
  try {
    console.log('🔍 Manual researcher config:', {
      model,
      isSearchEnabled,
      messageCount: messages.length
    })

    // Log the last message and any search results
    const lastMessage = messages[messages.length - 1]
    console.log('📝 Last message:', {
      role: lastMessage.role,
      content: lastMessage.content
    })

    // Check for search results in messages
    const searchResults = messages.find(m => {
      if (!('role' in m && 'content' in m)) return false
      const msg = m as ExtendedCoreMessage
      if (msg.role !== 'data') return false
      
      const content = msg.content
      if (typeof content !== 'object' || content === null) return false
      
      const toolCall = content as { type?: string, data?: { results?: unknown[] } }
      return toolCall.type === 'tool_call' && toolCall.data?.results !== undefined
    })
    
    if (searchResults) {
      console.log('🌐 Found search results:', {
        hasResults: true,
        resultData: (searchResults as ExtendedCoreMessage).content
      })
    } else {
      console.log('⚠️ No search results found in messages')
    }

    const date = new Date()
    const currentDate = date.toLocaleString('id-ID', { 
      timeZone: 'Asia/Jakarta',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB'
    const cookieStore = await cookies()
    const userName = cookieStore.get('user-name')?.value || 'Guest'
    const userInfo = `User name: ${userName}`
    const systemPrompt = isSearchEnabled
      ? SEARCH_ENABLED_PROMPT
      : SEARCH_DISABLED_PROMPT

    console.log('🤖 Configuring model:', {
      modelId: model,
      userName,
      isSearchEnabled
    })

    const config = {
      model: getModel(model),
      system: `${systemPrompt}\n${userInfo}\nCurrent date and time: ${currentDate}`,
      messages,
      temperature: 1,
      topP: 1,
      topK: 40,
      experimental_transform: smoothStream({ chunking: 'word' })
    }

    console.log('✅ Manual researcher configured successfully')
    return config
  } catch (error) {
    console.error('❌ Error in manualResearcher:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      model,
      isSearchEnabled
    })
    throw error
  }
}
