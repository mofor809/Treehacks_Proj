'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { extractInterests } from '@/lib/interests'
import { extractInterestsAI } from '@/lib/ai/interests'
import { checkForMatches } from '@/lib/actions/matches'
import { triggerMatchUpdate } from '@/lib/actions/ai-matches'
import { Widget, Profile } from '@/types/database'

// Feature flag: Use AI for interest extraction
const USE_AI_EXTRACTION = process.env.ANTHROPIC_API_KEY ? true : false

type WidgetWithProfile = Widget & {
  profiles: Profile | null
}

/** Ensure the current user has a profile row (fixes FK if signup trigger missed). */
async function ensureProfileExists(supabase: Awaited<ReturnType<typeof createClient>>, user: { id: string; user_metadata?: Record<string, unknown> }) {
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).single()
  if (existing) return
  await (supabase.from('profiles') as any).upsert(
    {
      id: user.id,
      username: (user.user_metadata?.username as string) ?? null,
      display_name: (user.user_metadata?.display_name as string) ?? null,
      avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
    },
    { onConflict: 'id' }
  )
}

export async function createWidget(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  await ensureProfileExists(supabase, user)

  const type = formData.get('type') as 'text' | 'image' | 'repost'
  const content = formData.get('content') as string | null
  const imageUrl = formData.get('imageUrl') as string | null
  const originalWidgetId = formData.get('originalWidgetId') as string | null

  // Extract interests from content
  // Use AI extraction if available, otherwise fall back to keyword matching
  let interestTags: string[] = []
  if (content) {
    if (USE_AI_EXTRACTION) {
      try {
        interestTags = await extractInterestsAI([content])
      } catch (error) {
        console.error('AI extraction failed, falling back to keyword matching:', error)
        interestTags = extractInterests(content)
      }
    } else {
      interestTags = extractInterests(content)
    }
  }

  // Get the next position
  const { data: lastWidgetData } = await supabase
    .from('widgets')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const lastWidget = lastWidgetData as { position: number } | null
  const nextPosition = (lastWidget?.position ?? -1) + 1

  const { data, error } = await (supabase
    .from('widgets') as any)
    .insert({
      user_id: user.id,
      type,
      content,
      image_url: imageUrl,
      original_widget_id: originalWidgetId,
      interest_tags: interestTags,
      position: nextPosition,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Check for new matches based on interest tags
  let matches: any[] = []
  if (interestTags.length > 0) {
    const matchResult = await checkForMatches(user.id, interestTags)
    matches = matchResult.matches
  }

  // Trigger AI-powered match update in background
  if (USE_AI_EXTRACTION) {
    // Don't await - run in background
    triggerMatchUpdate(user.id).catch((err) =>
      console.error('Background match update failed:', err)
    )
  }

  revalidatePath('/profile')
  revalidatePath('/')
  return { data, interestTags, matches }
}

export async function deleteWidget(widgetId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // First verify the widget exists and belongs to this user
  const { data: widget } = await supabase
    .from('widgets')
    .select('id, user_id')
    .eq('id', widgetId)
    .single()

  if (!widget) {
    return { error: 'Post not found' }
  }

  if (widget.user_id !== user.id) {
    return { error: 'You can only delete your own posts' }
  }

  const { error } = await (supabase
    .from('widgets') as any)
    .delete()
    .eq('id', widgetId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/')
  return { success: true }
}

export async function repostWidget(widgetId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get the original widget
  const { data: originalWidgetData, error: fetchError } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', widgetId)
    .single()

  const originalWidget = originalWidgetData as Widget | null

  if (fetchError || !originalWidget) {
    return { error: 'Widget not found' }
  }

  // Get the next position
  const { data: lastWidgetData } = await supabase
    .from('widgets')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const lastWidget = lastWidgetData as { position: number } | null
  const nextPosition = (lastWidget?.position ?? -1) + 1

  // Create repost
  const { data, error } = await (supabase
    .from('widgets') as any)
    .insert({
      user_id: user.id,
      type: 'repost',
      original_widget_id: widgetId,
      interest_tags: originalWidget.interest_tags,
      position: nextPosition,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/')
  return { data }
}

export async function getUserWidgets(userId?: string) {
  const supabase = await createClient()

  let targetUserId = userId

  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated', data: [] }
    }
    targetUserId = user.id
  }

  const { data: widgetsData, error } = await supabase
    .from('widgets')
    .select(`
      *,
      profiles:profiles!widgets_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('user_id', targetUserId)
    .order('position', { ascending: true })

  if (error) {
    return { error: error.message, data: [] }
  }

  const data = (widgetsData ?? []) as unknown as WidgetWithProfile[]

  // Fetch original widgets for reposts
  const repostIds = data
    .filter(w => w.type === 'repost' && w.original_widget_id)
    .map(w => w.original_widget_id!)

  if (repostIds.length > 0) {
    const { data: originalsData } = await supabase
      .from('widgets')
      .select(`
        *,
        profiles:profiles!widgets_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .in('id', repostIds)

    const originals = (originalsData ?? []) as unknown as WidgetWithProfile[]

    // Attach original widgets to reposts
    const originalsMap = new Map(originals.map(o => [o.id, o]))
    data.forEach(widget => {
      if (widget.type === 'repost' && widget.original_widget_id) {
        (widget as any).original_widget = originalsMap.get(widget.original_widget_id)
      }
    })
  }

  return { data }
}

export async function updateWidgetPositions(widgetIds: string[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Update positions in order
  const updates = widgetIds.map((id, index) =>
    (supabase.from('widgets') as any)
      .update({ position: index })
      .eq('id', id)
      .eq('user_id', user.id)
  )

  await Promise.all(updates)

  revalidatePath('/profile')
  return { success: true }
}
