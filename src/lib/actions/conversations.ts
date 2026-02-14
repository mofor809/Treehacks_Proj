'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Profile, Message } from '@/types/database'

/** Get or create a DM conversation between current user and the user with the given username. */
export async function getOrCreateDmWithUsername(otherUsername: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', data: null }

  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', otherUsername)
    .single()

  if (!otherProfile) return { error: 'User not found', data: null }
  if (otherProfile.id === user.id) return { error: 'Cannot message yourself', data: null }

  const userIds = [user.id, otherProfile.id].sort()
  const [user1, user2] = userIds

  const { data: existing } = await supabase
    .from('conversations')
    .select(`
      id,
      type,
      conversation_participants!inner ( user_id )
    `)
    .eq('type', 'dm')

  const existingDm = (existing ?? []).find((c: any) => {
    const participants = c.conversation_participants?.map((p: any) => p.user_id) ?? []
    return participants.includes(user1) && participants.includes(user2)
  })

  if (existingDm) {
    revalidatePath('/chat')
    return { data: { conversationId: existingDm.id, isNew: false } }
  }

  const { data: newConv, error: insertConvError } = await supabase
    .from('conversations')
    .insert({ type: 'dm' })
    .select('id')
    .single()

  if (insertConvError) return { error: insertConvError.message, data: null }

  await supabase.from('conversation_participants').insert([
    { conversation_id: newConv.id, user_id: user1 },
    { conversation_id: newConv.id, user_id: user2 },
  ])

  revalidatePath('/chat')
  return { data: { conversationId: newConv.id, isNew: true } }
}

/** Send a message. Optionally link to a post (for "message about this post"). */
export async function sendMessage(conversationId: string, content: string, postId?: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content.trim(),
    post_id: postId || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/chat')
  revalidatePath(`/chat/${conversationId}`)
  return { success: true }
}

/** Get all conversations for the current user (DMs and groups). */
export async function getMyConversations(): Promise<{
  error?: string
  data?: Array<{
    id: string
    type: 'dm' | 'group'
    post_id: string | null
    created_at: string
    otherParticipants?: Profile[]
    lastMessage?: { content: string; created_at: string }
    post?: { id: string } | null
  }>
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', data: [] }

  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (!participants?.length) return { data: [] }

  const convIds = [...new Set((participants as any[]).map(p => p.conversation_id))]
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, type, post_id, created_at')
    .in('id', convIds)

  const result: Array<{
    id: string
    type: 'dm' | 'group'
    post_id: string | null
    created_at: string
    otherParticipants?: Profile[]
    lastMessage?: { content: string; created_at: string }
    post?: { id: string } | null
  }> = []

  for (const c of convs ?? []) {
    const { data: allParticipants } = await supabase
      .from('conversation_participants')
      .select('user_id, profiles(id, username, display_name, avatar_url)')
      .eq('conversation_id', c.id)

    const others = (allParticipants ?? [])
      .filter((p: any) => p.user_id !== user.id)
      .map((p: any) => p.profiles)
      .filter(Boolean) as Profile[]

    const { data: lastMsg } = await supabase
      .from('messages')
      .select('content, created_at')
      .eq('conversation_id', c.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    result.push({
      id: c.id,
      type: c.type as 'dm' | 'group',
      post_id: c.post_id,
      created_at: c.created_at,
      otherParticipants: others,
      lastMessage: lastMsg ? { content: lastMsg.content, created_at: lastMsg.created_at } : undefined,
      post: c.post_id ? { id: c.post_id } : null,
    })
  }

  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return { data: result }
}

/** Get messages for a conversation. */
export async function getMessages(conversationId: string): Promise<{
  error?: string
  data?: Array<Message & { sender?: Profile }>
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', data: [] }

  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id ( id, username, display_name, avatar_url )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const list = (messages ?? []).map((m: any) => ({
    ...m,
    sender: m.sender,
  }))
  return { data: list }
}

/** Get user IDs who have messaged the current user about a specific post (for group chat creation). */
export async function getUserIdsWhoMessagedAboutPost(postId: string): Promise<{ error?: string; data?: string[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', data: [] }

  const { data: post } = await supabase.from('widgets').select('user_id').eq('id', postId).single()
  if (!post || post.user_id !== user.id) return { error: 'Not your post', data: [] }

  const { data: convParticipants } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .eq('user_id', user.id)

  const myConvIds = (convParticipants ?? []).map((p: any) => p.conversation_id)

  const { data: msgs } = await supabase
    .from('messages')
    .select('sender_id, conversation_id')
    .eq('post_id', postId)
    .in('conversation_id', myConvIds)

  const senderIds = [...new Set((msgs ?? []).map((m: any) => m.sender_id).filter((id: string) => id !== user.id))]
  return { data: senderIds }
}

/** Create a group chat for a post: add all users who have messaged the current user about that post. */
export async function createGroupChatForPost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', data: null }

  const { data: userIds, error: fetchErr } = await getUserIdsWhoMessagedAboutPost(postId)
  if (fetchErr || !userIds?.length) return { error: 'No one has messaged you about this post yet', data: null }

  const { data: newConv, error: insertErr } = await supabase
    .from('conversations')
    .insert({ type: 'group', post_id: postId })
    .select('id')
    .single()

  if (insertErr) return { error: insertErr.message, data: null }

  const rows = [{ conversation_id: newConv.id, user_id: user.id }, ...userIds.map(uid => ({ conversation_id: newConv.id, user_id: uid }))]
  await supabase.from('conversation_participants').insert(rows)

  revalidatePath('/chat')
  return { data: { conversationId: newConv.id } }
}
