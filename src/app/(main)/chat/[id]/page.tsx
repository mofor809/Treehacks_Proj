import { getMessages } from '@/lib/actions/conversations'
import { createClient } from '@/lib/supabase/server'
import { ConversationView } from './ConversationView'
import { redirect } from 'next/navigation'

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
    .select('profiles(username, display_name, avatar_url)')
    .eq('conversation_id', id)
    .neq('user_id', user.id)

  const otherUsers = participants
    ?.map((p: any) => p.profiles)
    .filter(Boolean) || []

  const headerTitle = isGroup
    ? 'Group Chat'
    : otherUsers[0]?.display_name || otherUsers[0]?.username || 'Chat'

  return (
    <div className="fixed inset-0 flex flex-col pb-24">
      {/* Header */}
      <div className="shrink-0 border-b bg-background px-4 py-3">
        <h1 className="font-semibold text-center">{headerTitle}</h1>
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

