import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConversationView } from './ConversationView'
import { getMessages, getUserIdsWhoMessagedAboutPost } from '@/lib/actions/conversations'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ post?: string }>
}) {
  const { id } = await params
  const { post: postFromUrl } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', id)

  const isParticipant = participants?.some((p: { user_id: string }) => p.user_id === user.id)
  if (!isParticipant) notFound()

  const { data: convData } = await supabase
    .from('conversations')
    .select('id, type, post_id')
    .eq('id', id)
    .single()

  type ConvRow = { id: string; type: 'dm' | 'group'; post_id: string | null }
  const conv: ConvRow | null = convData as ConvRow | null
  if (!conv) notFound()

  const { data: messages } = await getMessages(id)
  let messagedAboutPostUserIds: string[] = []
  if (conv.type === 'group' && conv.post_id) {
    const res = await getUserIdsWhoMessagedAboutPost(conv.post_id)
    messagedAboutPostUserIds = res.data ?? []
  }

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg z-10 safe-area-inset-top border-b border-border/50">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link href="/chat" className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold">Chat</span>
        </div>
      </div>
      <ConversationView
        conversationId={id}
        initialMessages={messages ?? []}
        currentUserId={user.id}
        postId={postFromUrl || conv.post_id}
        isGroup={conv.type === 'group'}
      />
    </div>
  )
}
