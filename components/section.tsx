'use client'

import { cn } from '@/lib/utils'
import {
  BookCheck,
  Check,
  Film,
  Image,
  MessageCircleMore,
  Newspaper,
  Repeat2,
  Search
} from 'lucide-react'
import React from 'react'
import { ToolBadge } from './tool-badge'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { StatusIndicator } from './ui/status-indicator'

type SectionProps = {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  title?: string
  separator?: boolean
}

export const Section: React.FC<SectionProps> = ({
  children,
  className,
  size = 'md',
  title,
  separator = false
}) => {
  const iconSize = 16
  const iconClassName = 'mr-1.5 text-muted-foreground'
  let icon: React.ReactNode
  switch (title) {
    case 'Images':
      // eslint-disable-next-line jsx-a11y/alt-text
      icon = <Image size={iconSize} className={iconClassName} />
      break
    case 'Videos':
      icon = <Film size={iconSize} className={iconClassName} />
      break
    case 'Sources':
      icon = <Newspaper size={iconSize} className={iconClassName} />
      break
    case 'Answer':
      icon = <BookCheck size={iconSize} className={iconClassName} />
      break
    case 'Related':
      icon = <Repeat2 size={iconSize} className={iconClassName} />
      break
    case 'Follow-up':
      icon = <MessageCircleMore size={iconSize} className={iconClassName} />
      break
    default:
      icon = <Search size={iconSize} className={iconClassName} />
  }

  return (
    <>
      {separator && <Separator className="my-2 bg-primary/10" />}
      <section
        className={cn(
          ` ${size === 'sm' ? 'py-1' : size === 'lg' ? 'py-4' : 'py-1'}`,
          className
        )}
      >
        {title && (
          <Badge
            variant="secondary"
            className="flex items-center leading-none w-fit my-1"
          >
            {icon}
            {title}
          </Badge>
        )}
        {children}
      </section>
    </>
  )
}

export function ToolArgsSection({
  children,
  tool,
  number,
  queries
}: {
  children: React.ReactNode
  tool: string
  number?: number
  queries?: string[]
}) {
  // If queries are provided, split the children into multiple badges
  const hasMultipleQueries = queries && queries.length > 0

  return (
    <Section size="sm" className="py-0 flex items-center justify-between">
      <div className="flex flex-wrap gap-2">
        {hasMultipleQueries ? (
          queries.map((query, index) => (
            <ToolBadge key={index} tool={tool} className="bg-muted">
              {query}
            </ToolBadge>
          ))
        ) : (
          <ToolBadge tool={tool}>{children}</ToolBadge>
        )}
      </div>
      {number && (
        <StatusIndicator icon={Check} iconClassName="text-green-500">
          {number} results
        </StatusIndicator>
      )}
    </Section>
  )
}
