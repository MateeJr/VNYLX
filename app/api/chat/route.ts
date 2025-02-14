import { createManualToolStreamResponse } from '@/lib/streaming/create-manual-tool-stream'
import { createToolCallingStreamResponse } from '@/lib/streaming/create-tool-calling-stream'
import { isProviderEnabled, isToolCallSupported } from '@/lib/utils/registry'
import { cookies } from 'next/headers'

export const maxDuration = 30

const DEFAULT_MODEL = 'google:gemini-2.0-flash'

export async function POST(req: Request) {
  try {
    const { messages, id: chatId, model: requestModel } = await req.json()
    const referer = req.headers.get('referer')
    const isSharePage = referer?.includes('/share/')

    if (isSharePage) {
      return new Response('Chat API is not available on share pages', {
        status: 403,
        statusText: 'Forbidden'
      })
    }

    const cookieStore = await cookies()
    const modelFromCookie = cookieStore.get('selected-model')?.value
    const searchMode = cookieStore.get('search-mode')?.value === 'true'
    
    const model = requestModel || modelFromCookie || DEFAULT_MODEL
    console.log('🤖 Request details:', {
      model,
      searchMode,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content
    })
    
    const provider = model.split(':')[0]
    
    if (!isProviderEnabled(provider)) {
      return new Response(`Selected provider is not enabled ${provider}`, {
        status: 404,
        statusText: 'Not Found'
      })
    }

    // When in think mode with search, use manual tool stream to avoid conflicts
    const isThinkMode = model.includes('thinking-exp')
    const useToolCalling = isToolCallSupported(model) && (!isThinkMode || !searchMode)
    
    console.log('🔄 Processing mode:', {
      isThinkMode,
      useToolCalling,
      searchMode
    })

    try {
      const response = useToolCalling
        ? await createToolCallingStreamResponse({
            messages,
            model,
            chatId,
            searchMode
          })
        : await createManualToolStreamResponse({
            messages,
            model,
            chatId,
            searchMode
          })

      // Add model info to response headers
      response.headers.set('x-model-used', model)
      console.log('✅ Response generated successfully')
      return response
    } catch (streamError) {
      console.error('Stream creation error:', {
        error: streamError,
        model,
        isThinkMode,
        useToolCalling,
        searchMode
      })
      throw streamError
    }
  } catch (error) {
    console.error('API route error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined
    })
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        status: 500
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
