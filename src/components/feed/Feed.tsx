'use client'

import { AnimatePresence } from 'framer-motion'
import { FeedCard } from './FeedCard'
import { Widget, Profile } from '@/types/database'

interface FeedProps {
  widgets: (Widget & {
    profiles?: Profile
    original_widget?: Widget & { profiles?: Profile }
  })[]
  currentUserId?: string
}

export function Feed({ widgets, currentUserId }: FeedProps) {
  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-muted-foreground">
          No posts yet. Be the first to share something!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      <AnimatePresence mode="popLayout">
        {widgets.map((widget) => (
          <FeedCard
            key={widget.id}
            widget={widget}
            currentUserId={currentUserId}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
