'use client'

import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'
import { Components } from 'react-markdown'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Citing } from './custom-link'
import { CodeBlock } from './ui/codeblock'
import { MemoizedReactMarkdown } from './ui/markdown'
import { useThinkMode } from './think-mode-toggle'

export function BotMessage({
  message,
  className
}: {
  message: string
  className?: string
}) {
  const { isThinkMode } = useThinkMode()
  // Check if the content contains LaTeX patterns
  const containsLaTeX = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/.test(
    message || ''
  )

  // Modify the content to render LaTeX equations if LaTeX patterns are found
  const processedData = preprocessLaTeX(message || '')

  if (containsLaTeX) {
    return (
      <MemoizedReactMarkdown
        rehypePlugins={[
          [rehypeExternalLinks, { target: '_blank' }],
          [rehypeKatex]
        ]}
        remarkPlugins={[remarkGfm, remarkMath]}
        className={cn(
          'prose-sm prose-neutral prose-a:text-accent-foreground/50',
          className
        )}
      >
        {processedData}
      </MemoizedReactMarkdown>
    )
  }

  return (
    <MemoizedReactMarkdown
      rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}
      remarkPlugins={[remarkGfm]}
      className={cn(
        'prose-sm prose-neutral prose-a:text-accent-foreground/50',
        className
      )}
      components={{
        code: function Code({ className, children, ...props }) {
          const content = String(children).replace(/\n$/, '')
          
          if (content === '▍') {
            return (
              <div className="relative">
                <span className="mt-1 cursor-default animate-pulse">▍</span>
                {isThinkMode && (
                  <div className="absolute top-0 left-6 bg-background/95 px-2 py-1 rounded-md border shadow-sm">
                    <span className="text-sm font-medium text-accent-blue">Thinking...</span>
                  </div>
                )}
              </div>
            )
          }

          if (content.includes('`▍`')) {
            return <span>{content.replace('`▍`', '▍')}</span>
          }

          const match = /language-(\w+)/.exec(className || '')
          const isInline = !match

          if (isInline) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }

          return (
            <CodeBlock
              key={Math.random()}
              language={(match && match[1]) || ''}
              value={content}
              {...props}
            />
          )
        },
        a: Citing
      }}
    >
      {message}
    </MemoizedReactMarkdown>
  )
}

// Preprocess LaTeX equations to be rendered by KaTeX
// ref: https://github.com/remarkjs/react-markdown/issues/785
const preprocessLaTeX = (content: string) => {
  const blockProcessedContent = content.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, equation) => `$$${equation}$$`
  )
  const inlineProcessedContent = blockProcessedContent.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, equation) => `$${equation}$`
  )
  return inlineProcessedContent
}
