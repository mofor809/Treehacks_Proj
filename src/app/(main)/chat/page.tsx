import { createClient } from '@/lib/supabase/server'
import { getUserMatches } from '@/lib/actions/matches'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Sparkles } from 'lucide-react'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: matches } = user
    ? await getUserMatches(user.id)
    : { data: [] }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg z-10 safe-area-inset-top">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-lg font-semibold">Matches</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        {matches.length > 0 ? (
          <div className="space-y-3">
            {matches.map((match: any) => (
              <Card key={match.id} className="p-4">
                <div className="flex items-start gap-3">
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

                    {/* Shared interests */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {match.shared_tags?.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {match.shared_tags?.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                          +{match.shared_tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Conversation starter */}
                    {match.conversation_starter && (
                      <p className="text-sm text-muted-foreground italic mt-2 line-clamp-2">
                        &ldquo;{match.conversation_starter}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-medium mb-2">No matches yet</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Add more widgets to your profile to find people with similar interests!
            </p>
          </div>
        )}

        {/* Coming soon notice */}
        <div className="mt-8 p-4 bg-secondary/50 rounded-xl text-center">
          <MessageCircle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Direct messaging coming soon!
          </p>
        </div>
      </div>
    </div>
  )
}
