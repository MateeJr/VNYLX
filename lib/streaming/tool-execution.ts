import {
  CoreMessage,
  DataStreamWriter,
  generateId,
  generateText,
  JSONValue
} from 'ai'
import { z } from 'zod'
import { searchSchema } from '../schema/search'
import { search } from '../tools/search'
import { ExtendedCoreMessage } from '../types'
import { getToolCallModel } from '../utils/registry'
import { parseToolCallXml } from './parse-tool-call'

interface ToolExecutionResult {
  toolCallDataAnnotation: ExtendedCoreMessage | null
  toolCallMessages: CoreMessage[]
}

export async function executeToolCall(
  coreMessages: CoreMessage[],
  dataStream: DataStreamWriter,
  model: string,
  searchMode: boolean
): Promise<ToolExecutionResult> {
  // If search mode is disabled, return empty tool call
  if (!searchMode) {
    return { toolCallDataAnnotation: null, toolCallMessages: [] }
  }

  const toolCallModel = getToolCallModel(model)
  // Convert Zod schema to string representation
  const searchSchemaString = Object.entries(searchSchema.shape)
    .map(([key, value]) => {
      const description = value.description
      const isOptional = value instanceof z.ZodOptional
      return `- ${key}${isOptional ? ' (optional)' : ''}: ${description}`
    })
    .join('\n')
  const defaultMaxResults = model?.includes('ollama') ? 5 : 20

  // Generate tool selection using XML format
  const toolSelectionResponse = await generateText({
    model: toolCallModel,
    system: `You are an intelligent assistant that analyzes conversations to select the most appropriate tools and their parameters.
            You excel at understanding context to determine when and how to use available tools, including crafting effective search queries.
            Current date: ${new Date().toISOString().split('T')[0]}

            For multiple distinct search queries, combine them with " AND " between each query.
            For example: "current US president AND elon musk mother name"

            Do not include any other text in your response.
            Respond in XML format with the following structure:
            <tool_call>
              <tool>tool_name</tool>
              <parameters>
                <query>search query text</query>
                <max_results>number - ${defaultMaxResults} by default</max_results>
                <search_depth>basic or advanced</search_depth>
                <include_domains>domain1,domain2</include_domains>
                <exclude_domains>domain1,domain2</exclude_domains>
              </parameters>
            </tool_call>

            Available tools: search

            Search parameters:
            ${searchSchemaString}

            If you don't need a tool, respond with <tool_call><tool></tool></tool_call>`,
    messages: coreMessages
  })

  // Parse the tool selection XML using the search schema
  const toolCall = parseToolCallXml(toolSelectionResponse.text, searchSchema)

  if (!toolCall || toolCall.tool === '') {
    return { toolCallDataAnnotation: null, toolCallMessages: [] }
  }

  const toolCallAnnotation = {
    type: 'tool_call',
    data: {
      state: 'call',
      toolCallId: `call_${generateId()}`,
      toolName: toolCall.tool,
      args: JSON.stringify(toolCall.parameters)
    }
  }
  dataStream.writeData(toolCallAnnotation)

  // Support for search tool only for now
  const searchParams = {
    query: toolCall.parameters?.query ?? '',
    max_results: toolCall.parameters?.max_results ?? 20,
    search_depth: (toolCall.parameters?.search_depth as 'basic' | 'advanced') ?? 'basic',
    include_domains: toolCall.parameters?.include_domains ?? [],
    exclude_domains: toolCall.parameters?.exclude_domains ?? []
  }

  // Extract multiple queries if present (queries separated by " AND ")
  const queries = searchParams.query.split(' AND ').map(q => q.trim())
  const isMultipleQueries = queries.length > 1

  // If multiple queries, execute them in parallel
  const results = isMultipleQueries
    ? await Promise.all(
        queries.map(query =>
          search(
            query,
            searchParams.max_results,
            searchParams.search_depth,
            searchParams.include_domains,
            searchParams.exclude_domains
          )
        )
      )
    : [await search(
        searchParams.query,
        searchParams.max_results,
        searchParams.search_depth,
        searchParams.include_domains,
        searchParams.exclude_domains
      )]

  const updatedToolCallAnnotation = {
    ...toolCallAnnotation,
    data: {
      ...toolCallAnnotation.data,
      result: JSON.stringify({
        results,
        queries: isMultipleQueries ? queries : undefined
      }),
      state: 'result'
    }
  }
  dataStream.writeMessageAnnotation(updatedToolCallAnnotation)

  const toolCallDataAnnotation: ExtendedCoreMessage = {
    role: 'data',
    content: {
      type: 'tool_call',
      data: updatedToolCallAnnotation.data
    } as JSONValue
  }

  const toolCallMessages: CoreMessage[] = [
    {
      role: 'assistant',
      content: `Tool call result: ${JSON.stringify({
        results,
        queries: isMultipleQueries ? queries : undefined
      })}`
    },
    {
      role: 'user',
      content: 'Now answer the user question.'
    }
  ]

  return { toolCallDataAnnotation, toolCallMessages }
}
