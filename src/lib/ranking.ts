/**
 * AI-curated ranking: order a profile's posts by relevance to the viewer.
 * Prioritizes posts that align with shared interests between viewer and profile owner.
 * Falls back to chronological order when interest data is unavailable.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { findSharedInterests } from '@/lib/interests'
import { Widget, Profile } from '@/types/database'

type WidgetWithProfile = Widget & {
  profiles: Profile | null
  original_widget?: Widget & { profiles: Profile | null }
}

/**
 * Get all interest tags from a user's widgets (own posts, not reposts).
 */
async function getViewerInterestTags(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data: widgets } = await supabase
    .from('widgets')
    .select('interest_tags')
    .eq('user_id', userId)
    .in('type', ['text', 'image'])

  const allTags: string[] = []
  for (const w of widgets ?? []) {
    if (w.interest_tags?.length) allTags.push(...w.interest_tags)
  }
  return [...new Set(allTags)]
}

/**
 * Score a single widget for the viewer: number of shared interests (from widget tags vs viewer tags).
 */
function scoreWidget(widget: WidgetWithProfile, viewerTags: string[]): number {
  const widgetTags = widget.interest_tags ?? []
  const shared = findSharedInterests(viewerTags, widgetTags)
  return shared.length
}

/**
 * Rank profile widgets by shared interests with the viewer.
 * Higher score = more shared interests = higher in list. Ties broken by created_at desc.
 */
export async function rankWidgetsBySharedInterests(
  widgets: WidgetWithProfile[],
  viewerUserId: string,
  supabase: SupabaseClient
): Promise<WidgetWithProfile[]> {
  const viewerTags = await getViewerInterestTags(supabase, viewerUserId)

  if (viewerTags.length === 0) {
    return [...widgets].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  return [...widgets].sort((a, b) => {
    const scoreA = scoreWidget(a, viewerTags)
    const scoreB = scoreWidget(b, viewerTags)
    if (scoreB !== scoreA) return scoreB - scoreA
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}
