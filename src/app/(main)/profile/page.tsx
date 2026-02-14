import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileContent } from './ProfileContent'
import { Widget, Profile } from '@/types/database'

type WidgetWithProfile = Widget & {
  profiles: Profile | null
  original_widget?: Widget & { profiles: Profile | null }
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user widgets
  const { data: widgets } = await supabase
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
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  const typedWidgets = (widgets ?? []) as unknown as WidgetWithProfile[]

  // Fetch original widgets for reposts
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

  return (
    <ProfileContent
      profile={profile as Profile | null}
      widgets={widgetsWithOriginals as any}
      isOwner={true}
    />
  )
}
