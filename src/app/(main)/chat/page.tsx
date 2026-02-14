import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserMatches } from '@/lib/actions/matches'
import { getMyConversations } from '@/lib/actions/conversations'
import { getOrCreateDmWithUsername } from '@/lib/actions/conversations'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChatList } from './ChatList'
import { MessageCircle, Sparkles } from 'lucide-react'

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string; post?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { with: withUsername, post: postId } = await searchParams

  if (withUsername) {
    const result = await getOrCreateDmWithUsername(withUsername)
    if (result.data?.conversationId) {
      const q = postId ? `?post=${postId}` : ''
      redirect(`/chat/${result.data.conversationId}${q}`)
    }
  }

  const { data: matches } = await getUserMatches(user.id)
  const { data: conversations } = await getMyConversations()

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg z-10 safe-area-inset-top">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-lg font-semibold">Chat</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-8">
        {matches && matches.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Matches</h2>
            <div className="space-y-2">
              {matches.map((match: any) => (
                <Link key={match.id} href={`/chat?with=${encodeURIComponent(match.otherUser?.username ?? '')}`}>
                  <Card className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={match.otherUser?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {match.otherUser?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {match.otherUser?.display_name || match.otherUser?.username}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{match.otherUser?.username}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {match.shared_tags?.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <MessageCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Conversations</h2>
          <ChatList conversations={conversations ?? []} />
        </section>
      </div>
    </div>
  )
}
