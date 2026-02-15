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
  return await (supabase.from('messages') as any).insert({
    conversation_id: conversationId,
    content: content.trim(),
    post_id: postId ?? null,
  })
}