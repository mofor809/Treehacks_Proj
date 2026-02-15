import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileContent } from '../ProfileContent'
import { getProfileByUsername } from '@/lib/actions/profile'
import { rankWidgetsBySharedInterests } from '@/lib/ranking'
import { Widget, Profile } from '@/types/database'

type WidgetWithProfile = Widget & {
  profiles: Profile | null
  original_widget?: Widget & { profiles: Profile | null }
}

export default async function ProfileByUsernamePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const profile = await getProfileByUsername(username)
  if (!profile) notFound()

  const isOwner = currentUser?.id === profile.id

  const { data: widgets } = await supabase
    .from('widgets')
    .select(`
      *,
      profiles:profiles!widgets_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        school_year
      )
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const typedWidgets = (widgets ?? []) as unknown as WidgetWithProfile[]

  const repostIds = typedWidgets
    .filter(w => w.type === 'repost' && w.original_widget_id)
    .map(w => w.original_widget_id!)

  let widgetsWithOriginals: WidgetWithProfile[] = typedWidgets

  if (repostIds.length > 0) {
    const { data: originals } = await supabase
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

    const typedOriginals = (originals ?? []) as unknown as WidgetWithProfile[]
    const originalsMap = new Map(typedOriginals.map(o => [o.id, o]))

    widgetsWithOriginals = typedWidgets.map(widget => {
      if (widget.type === 'repost' && widget.original_widget_id) {
        return { ...widget, original_widget: originalsMap.get(widget.original_widget_id) }
      }
      return widget
    })
  }

  // When viewing another user's profile: AI-based ranking by shared interests (fallback: chronological)
  let orderedWidgets = widgetsWithOriginals
  if (!isOwner && currentUser) {
    orderedWidgets = await rankWidgetsBySharedInterests(
      widgetsWithOriginals,
      currentUser.id,
      supabase
    )
  }

  return (
    <ProfileContent
      profile={profile as Profile | null}
      widgets={orderedWidgets as any}
      isOwner={isOwner}
      currentUserId={currentUser?.id}
    />
  )
}
