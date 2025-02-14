import { CoreMessage, smoothStream, streamText } from 'ai'
import { retrieveTool } from '../tools/retrieve'
import { searchTool } from '../tools/search'
import { getModel } from '../utils/registry'
import { cookies } from 'next/headers'

const SYSTEM_PROMPT = `
Instructions:

You are a helpful AI assistant with access to real-time web search and content retrieval capabilities.
When asked a question, you should:
1. Search for relevant information using the search tool when needed
2. Use the retrieve tool to get detailed content from specific URLs
3. Analyze all search results to provide accurate, up-to-date information
4. Always cite sources using the [number](url) format, matching the order of search results. If multiple sources are relevant, include all of them, and comma separate them. Only use information that has a URL available for citation.
5. If results are not relevant or helpful, rely on your general knowledge
6. Provide comprehensive and detailed responses based on search results, ensuring thorough coverage of the user's question
7. Use markdown to structure your responses. Use headings to break up the content into sections.
8. **Use the retrieve tool only with user-provided URLs.**

Citation Format:
[number](url)
`

type ResearcherReturn = Parameters<typeof streamText>[0]

export async function researcher({
  messages,
  model,
  searchMode
}: {
  messages: CoreMessage[]
  model: string
  searchMode: boolean
}): Promise<ResearcherReturn> {
  try {
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

    return {
      model: getModel(model),
      system: `${SYSTEM_PROMPT}\n${userInfo}\nCurrent date and time: ${currentDate}`,
      messages,
      tools: {
        search: searchTool,
        retrieve: retrieveTool
      },
      experimental_activeTools: searchMode ? ['search', 'retrieve'] : [],
      maxSteps: searchMode ? 5 : 1,
      experimental_transform: smoothStream({ chunking: 'word' })
    }
  } catch (error) {
    console.error('Error in chatResearcher:', error)
    throw error
  }
}
