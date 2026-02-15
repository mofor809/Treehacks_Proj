import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/navigation/BottomNav'
import { MatchNotificationWrapper } from '@/components/notifications/MatchNotificationWrapper'
import { getRecommendedMatches } from '@/lib/actions/ai-matches'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch AI-powered matches for notification
  const { matches } = await getRecommendedMatches(user.id)

  return (
    <div className="min-h-screen">
      {/* Match notification on app open */}
      <MatchNotificationWrapper matches={matches} />
      {children}
      <BottomNav />
    </div>
  )
}
