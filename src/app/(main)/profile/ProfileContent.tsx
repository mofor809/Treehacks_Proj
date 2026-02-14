'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Settings, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { WidgetGrid } from '@/components/widgets/WidgetGrid'
import { AddWidgetModal } from '@/components/widgets/AddWidgetModal'
import { Profile, Widget } from '@/types/database'
import { signOut } from '@/lib/actions/auth'
import { useRouter } from 'next/navigation'

interface ProfileContentProps {
  profile: Profile | null
  widgets: (Widget & {
    profiles?: Profile
    original_widget?: Widget & { profiles?: Profile }
  })[]
  isOwner?: boolean
}

export function ProfileContent({ profile, widgets, isOwner = false }: ProfileContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg z-10 safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Profile</h1>
          {isOwner && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile info */}
      <div className="px-4 py-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {profile?.username?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="text-xl font-semibold">
              {profile?.display_name || profile?.username || 'Unknown'}
            </h2>
            <p className="text-sm text-muted-foreground">
              @{profile?.username || 'unknown'}
            </p>
            {profile?.bio && (
              <p className="text-sm mt-2">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-lg font-semibold">{widgets.length}</p>
            <p className="text-xs text-muted-foreground">Widgets</p>
          </div>
        </div>
      </div>

      {/* Widgets grid */}
      <div className="px-4">
        <WidgetGrid widgets={widgets} isOwner={isOwner} />
      </div>

      {/* Floating add button */}
      {isOwner && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 left-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-30"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Add widget modal */}
      <AddWidgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
