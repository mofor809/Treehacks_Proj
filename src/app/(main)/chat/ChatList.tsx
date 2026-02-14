'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Profile } from '@/types/database'

type Conv = {
  id: string
  type: 'dm' | 'group'
  post_id: string | null
  created_at: string
  otherParticipants?: Profile[]
  lastMessage?: { content: string; created_at: string }
}

export function ChatList({ conversations }: { conversations: Conv[] }) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-muted-foreground">No conversations yet.</p>
        <p className="text-sm text-muted-foreground mt-1">Message someone from their profile or a post.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`/chat/${c.id}`}
          className="flex items-center gap-3 p-4 rounded-2xl hover:bg-muted/50 transition-colors"
        >
          {c.type === 'dm' && c.otherParticipants?.[0] ? (
            <Avatar className="w-12 h-12 shrink-0">
              <AvatarImage src={c.otherParticipants[0].avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {c.otherParticipants[0].username?.[0]?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-lg">
              {c.otherParticipants?.length ?? 0}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {c.type === 'dm'
                ? c.otherParticipants?.[0]?.display_name || c.otherParticipants?.[0]?.username || 'Unknown'
                : `Group ${c.post_id ? '(post)' : ''}`}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {c.lastMessage?.content ?? 'No messages yet'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
