import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const supabase = createClient()

// client-side
export async function sendMessageClient(
  conversationId: string,
  content: string,
  postId?: string | null
) {
  const trimmed = content.trim()
  if (!trimmed) {
    return { data: null, error: { message: 'Message cannot be empty' } }
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      data: null,
      error: { message: authError?.message ?? 'Not authenticated' },
    }
  }

  return await (supabase.from('messages') as any).insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: trimmed,
    post_id: postId ?? null,
  })
}