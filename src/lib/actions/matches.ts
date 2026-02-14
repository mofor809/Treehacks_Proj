'use server'

import { createClient } from '@/lib/supabase/server'
import { findSharedInterests } from '@/lib/interests'
import { Widget, Profile, Match } from '@/types/database'

const MATCH_THRESHOLD = 3 // Minimum shared interests for a match

const CONVERSATION_STARTERS = [
  "You both seem to love {interests}! What got you into it?",
  "I noticed you both are into {interests}. Have you discovered anything cool lately?",
  "Fellow {interests} enthusiasts! What's your favorite part about it?",
  "{interests} connection! Would love to hear your thoughts on it.",
  "Looks like we found another {interests} fan! What's your story?",
]

function generateConversationStarter(sharedTags: string[]): string {
  const interests = sharedTags.slice(0, 2).join(' and ')
  const template = CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)]
  return template.replace('{interests}', interests)
}

type WidgetWithTags = Pick<Widget, 'user_id' | 'interest_tags'> & {
  profiles: Profile | null
}

export async function checkForMatches(userId: string, newTags: string[]) {
  const supabase = await createClient()

  if (newTags.length === 0) {
    return { matches: [] }
  }

  // Get all other users' widgets with overlapping tags
  const { data: otherWidgetsData } = await supabase
    .from('widgets')
    .select(`
      user_id,
      interest_tags,
      profiles:profiles!widgets_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .neq('user_id', userId)
    .not('interest_tags', 'is', null)

  const otherWidgets = (otherWidgetsData ?? []) as unknown as WidgetWithTags[]

  if (otherWidgets.length === 0) {
    return { matches: [] }
  }

  // Group widgets by user and collect all their tags
  const userTagsMap = new Map<string, Set<string>>()

  for (const widget of otherWidgets) {
    if (!widget.interest_tags) continue

    const existing = userTagsMap.get(widget.user_id) ?? new Set()
    widget.interest_tags.forEach(tag => existing.add(tag))
    userTagsMap.set(widget.user_id, existing)
  }

  // Find matches
  const newMatches: Array<{
    otherUserId: string
    sharedTags: string[]
    conversationStarter: string
  }> = []

  for (const [otherUserId, otherTags] of userTagsMap) {
    const sharedTags = findSharedInterests(newTags, Array.from(otherTags))

    if (sharedTags.length >= MATCH_THRESHOLD) {
      // Check if match already exists
      const [id1, id2] = [userId, otherUserId].sort()

      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .eq('user1_id', id1)
        .eq('user2_id', id2)
        .single()

      if (!existingMatch) {
        // Create new match
        const conversationStarter = generateConversationStarter(sharedTags)

        const { error } = await (supabase
          .from('matches') as any)
          .insert({
            user1_id: id1,
            user2_id: id2,
            shared_tags: sharedTags,
            conversation_starter: conversationStarter,
          })
          .select()
          .single()

        if (!error) {
          newMatches.push({
            otherUserId,
            sharedTags,
            conversationStarter,
          })
        }
      }
    }
  }

  return { matches: newMatches }
}

type MatchWithProfiles = Match & {
  user1: Profile | null
  user2: Profile | null
}

export async function getUserMatches(userId: string) {
  const supabase = await createClient()

  const { data: matchesData, error } = await supabase
    .from('matches')
    .select(`
      *,
      user1:profiles!matches_user1_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      ),
      user2:profiles!matches_user2_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: [] }
  }

  const matches = (matchesData ?? []) as unknown as MatchWithProfiles[]

  // Transform to include the "other" user
  const transformedMatches = matches.map(match => {
    const otherUser = match.user1_id === userId ? match.user2 : match.user1
    return {
      ...match,
      otherUser,
    }
  })

  return { data: transformedMatches }
}

export async function getUnnotifiedMatches(userId: string) {
  const supabase = await createClient()

  const { data: matchesData, error } = await supabase
    .from('matches')
    .select(`
      *,
      user1:profiles!matches_user1_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      ),
      user2:profiles!matches_user2_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('notified', false)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: [] }
  }

  const matches = (matchesData ?? []) as unknown as MatchWithProfiles[]

  // Mark as notified
  if (matches.length > 0) {
    const matchIds = matches.map(m => m.id)
    await (supabase
      .from('matches') as any)
      .update({ notified: true })
      .in('id', matchIds)
  }

  // Transform to include the "other" user
  const transformedMatches = matches.map(match => {
    const otherUser = match.user1_id === userId ? match.user2 : match.user1
    return {
      ...match,
      otherUser,
    }
  })

  return { data: transformedMatches }
}
