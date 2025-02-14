import {
  convertToCoreMessages,
  createDataStreamResponse,
  DataStreamWriter,
  JSONValue,
  streamText,
  CoreMessage
} from 'ai'
import { manualResearcher } from '../agents/manual-researcher'
import { ExtendedCoreMessage } from '../types'
import { getMaxAllowedTokens, truncateMessages } from '../utils/context-window'
import { handleStreamFinish } from './handle-stream-finish'
import { executeToolCall } from './tool-execution'
import { BaseStreamConfig } from './types'

export function createManualToolStreamResponse(config: BaseStreamConfig) {
  return createDataStreamResponse({
    execute: async (dataStream: DataStreamWriter) => {
      const { messages, model, chatId, searchMode } = config
      try {
        console.log('🔍 Starting manual tool stream:', {
          model,
          searchMode,
          messageCount: messages.length
        })

        const coreMessages = convertToCoreMessages(messages)
        const truncatedMessages = truncateMessages(
          coreMessages,
          getMaxAllowedTokens(model)
        )

        console.log('🔄 Executing tool call...')
        const { toolCallDataAnnotation, toolCallMessages } =
          await executeToolCall(
            truncatedMessages,
            dataStream,
            model,
            searchMode
          )

        console.log('🧠 Tool call results:', {
          hasToolCallData: !!toolCallDataAnnotation,
          toolCallMessageCount: toolCallMessages.length,
          toolCallContent: toolCallMessages.map(m => m.content),
          toolCallDataAnnotation: toolCallDataAnnotation ? JSON.stringify(toolCallDataAnnotation, null, 2) : null
        })

        // Add the tool call data annotation first if it exists
        const allMessages = [
          ...truncatedMessages,
          ...(toolCallDataAnnotation ? [toolCallDataAnnotation as CoreMessage] : []),
          ...toolCallMessages
        ]

        console.log('📚 All messages being sent to researcher:', 
          allMessages.map(m => ({
            role: m.role,
            contentType: typeof m.content,
            isData: (m as ExtendedCoreMessage).role === 'data',
            content: m.content
          }))
        )

        console.log('🤖 Configuring researcher...')
        const researcherConfig = await manualResearcher({
          messages: allMessages,
          model,
          isSearchEnabled: searchMode
        })

        // Variables to track the reasoning timing.
        let reasoningStartTime: number | null = null
        let reasoningDuration: number | null = null

        console.log('📝 Starting text stream...')
        const result = streamText({
          ...researcherConfig,
          onFinish: async result => {
            console.log('✅ Stream finished:', {
              hasReasoning: !!result.reasoning,
              reasoningDuration
            })

            const annotations: ExtendedCoreMessage[] = [
              ...(toolCallDataAnnotation ? [toolCallDataAnnotation] : []),
              {
                role: 'data',
                content: {
                  type: 'reasoning',
                  data: {
                    time: reasoningDuration ?? 0,
                    reasoning: result.reasoning
                  }
                } as JSONValue
              }
            ]

            await handleStreamFinish({
              responseMessages: result.response.messages,
              originalMessages: messages,
              model,
              chatId,
              dataStream,
              skipRelatedQuestions: true,
              annotations
            })
          },
          onChunk(event) {
            const chunkType = event.chunk?.type

            if (chunkType === 'reasoning') {
              if (reasoningStartTime === null) {
                reasoningStartTime = Date.now()
                console.log('🤔 Started reasoning...')
              }
            } else {
              if (reasoningStartTime !== null) {
                const elapsedTime = Date.now() - reasoningStartTime
                reasoningDuration = elapsedTime
                console.log('💭 Finished reasoning:', { elapsedTime })
                dataStream.writeMessageAnnotation({
                  type: 'reasoning',
                  data: { time: elapsedTime }
                } as JSONValue)
                reasoningStartTime = null
              }
            }
          }
        })

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true
        })
      } catch (error) {
        console.error('❌ Stream execution error:', {
          error,
          stack: error instanceof Error ? error.stack : undefined,
          model,
          searchMode
        })
        throw error
      }
    },
    onError: error => {
      console.error('❌ Stream error:', {
        error,
        stack: error instanceof Error ? error.stack : undefined
      })
      return error instanceof Error ? error.message : String(error)
    }
  })
}
