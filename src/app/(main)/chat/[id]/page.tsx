import { getMessages } from '@/lib/actions/conversations'
import { createClient } from '@/lib/supabase/server'
import { ConversationView } from './ConversationView'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params

  // Get current user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch initial messages
  const { data: messages, error } = await getMessages(id)

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Error loading conversation: {error}</p>
      </div>
    )
  }

  // Get conversation details to check if it's a group chat
  const { data: conversation } = await supabase
    .from('conversations')
    .select('type, post_id')
    .eq('id', id)
    .single()

  const conversationData = conversation as { type: 'dm' | 'group'; post_id: string | null } | null
  const isGroup = conversationData?.type === 'group'
  const postId = conversationData?.post_id ?? null

  // Get participant info for header
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id, profiles(id, username, display_name, avatar_url)')
    .eq('conversation_id', id)
    .neq('user_id', user.id)

  const otherUsers = participants
    ?.map((p: any) => ({ id: p.user_id, ...p.profiles }))
    .filter(Boolean) || []

  const headerTitle = isGroup
    ? 'Group Chat'
    : otherUsers[0]?.display_name || otherUsers[0]?.username || 'Chat'

  // Fetch shared interests for DM chats
  let sharedInterests: Record<string, string> = {}
  if (!isGroup && otherUsers[0]?.id) {
    const otherUserId = otherUsers[0].id
    const [id1, id2] = user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id]

    const { data: matchData } = await (supabase
      .from('user_matches') as any)
      .select('shared_interests')
      .eq('user1_id', id1)
      .eq('user2_id', id2)
      .single()

    const match = matchData as { shared_interests: Record<string, string> } | null
    if (match?.shared_interests) {
      sharedInterests = match.shared_interests
    }
  }

  const sharedInterestsList = Object.keys(sharedInterests)

  return (
    <div className="fixed inset-0 flex flex-col pb-24">
      {/* Header */}
      <div className="shrink-0 border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1 className="font-semibold text-center flex-1">{headerTitle}</h1>
          <div className="w-5" /> {/* Spacer for centering */}
        </div>

        {/* Shared interests banner */}
        {sharedInterestsList.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-1.5">You both share</p>
            <div className="flex flex-wrap gap-1.5">
              {sharedInterestsList.slice(0, 3).map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-1 text-xs font-medium gradient-primary-subtle text-[#3D3A7E] rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConversationView
        conversationId={id}
        initialMessages={messages ?? []}
        currentUserId={user.id}
        postId={postId}
        isGroup={isGroup}
      />
    </div>
  )
}

