'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  extractInterestsAI,
  matchInterestsAI,
  generateConversationStarter,
  calculateMatchScore,
} from '@/lib/ai/interests'

/**
 * Extract interests from a user's posts using AI.
 * Called after a user creates a new widget.
 */
export async function extractUserInterests(userId: string): Promise<{
  interests: string[]
  error?: string
}> {
  const supabase = await createClient()

  // Fetch user's posts (excluding reposts)
  const { data: widgets, error: fetchError } = await supabase
    .from('widgets')
    .select('content')
    .eq('user_id', userId)
    .neq('type', 'repost')

  if (fetchError) {
    return { interests: [], error: fetchError.message }
  }

  // Extract text content
  const posts = ((widgets ?? []) as any[])
    .map((w) => w.content)
    .filter(Boolean) as string[]

  if (posts.length === 0) {
    return { interests: [] }
  }

  // Use AI to extract interests
  const interests = await extractInterestsAI(posts)

  return { interests }
}

/**
 * Update matches for a user after they create a new post.
 * Compares the user's interests with all other users.
 */
export async function updateUserMatches(userId: string): Promise<{
  matchesUpdated: number
  error?: string
}> {
  const supabase = await createClient()

  // Step 1: Extract this user's interests
  const { interests: userInterests, error: extractError } =
    await extractUserInterests(userId)

  if (extractError) {
    return { matchesUpdated: 0, error: extractError }
  }

  if (userInterests.length === 0) {
    return { matchesUpdated: 0 }
  }

  // Step 2: Get all other users with their posts
  const { data: otherUsersData, error: usersError } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', userId)

  if (usersError) {
    return { matchesUpdated: 0, error: usersError.message }
  }

  const otherUsers = (otherUsersData ?? []) as Array<{ id: string }>
  let matchesUpdated = 0

  // Step 3: Compare with each other user
  for (const otherUser of otherUsers) {
    const { interests: otherInterests } = await extractUserInterests(
      otherUser.id
    )

    if (otherInterests.length === 0) continue

    // Generate match
    const sharedInterests = await matchInterestsAI(userInterests, otherInterests)

    if (Object.keys(sharedInterests).length === 0) continue

    const score = calculateMatchScore(sharedInterests)
    const starter = await generateConversationStarter(sharedInterests)

    // Ensure user1_id < user2_id for database constraint
    const [user1Id, user2Id] =
      userId < otherUser.id ? [userId, otherUser.id] : [otherUser.id, userId]

    // Upsert match
    const { error: upsertError } = await (supabase
      .from('user_matches') as any)
      .upsert(
        {
          user1_id: user1Id,
          user2_id: user2Id,
          shared_interests: sharedInterests,
          match_score: score,
          conversation_starter: starter,
        },
        { onConflict: 'user1_id,user2_id' }
      )

    if (!upsertError) {
      matchesUpdated++
    }
  }

  revalidatePath('/chat')
  return { matchesUpdated }
}

/**
 * Get recommended matches for a user.
 * Returns users sorted by match score with explanations.
 */
export async function getRecommendedMatches(userId: string): Promise<{
  matches: Array<{
    userId: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    sharedInterests: Record<string, string>
    matchScore: number
    conversationStarter: string | null
  }>
  error?: string
}> {
  const supabase = await createClient()

  // Find matches where this user is involved
  const { data: matchesData, error: matchesError } = await supabase
    .from('user_matches')
    .select(
      `
      user1_id,
      user2_id,
      shared_interests,
      match_score,
      conversation_starter
    `
    )
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('match_score', { ascending: false })
    .limit(20)

  if (matchesError) {
    return { matches: [], error: matchesError.message }
  }

  const matchesList = (matchesData ?? []) as any[]

  // Get the other user's profile for each match
  const matches = []

  for (const m of matchesList) {
    const otherUserId = m.user1_id === userId ? m.user2_id : m.user1_id

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', otherUserId)
      .single()

    const profile = profileData as {
      id: string
      username: string
      display_name: string | null
      avatar_url: string | null
    } | null

    if (profile) {
      matches.push({
        userId: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        sharedInterests: m.shared_interests,
        matchScore: m.match_score,
        conversationStarter: m.conversation_starter,
      })
    }
  }

  return { matches }
}

/**
 * Trigger match update after widget creation.
 * This is called from the createWidget action.
 */
export async function triggerMatchUpdate(userId: string): Promise<void> {
  // Run in background to not block the widget creation response
  // In production, this could be a queued job
  try {
    await updateUserMatches(userId)
  } catch (error) {
    console.error('Error updating matches:', error)
  }
}
