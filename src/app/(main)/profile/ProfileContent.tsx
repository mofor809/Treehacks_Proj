'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Settings, LogOut, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WidgetGrid } from '@/components/widgets/WidgetGrid'
import { AddWidgetModal } from '@/components/widgets/AddWidgetModal'
import { Profile, Widget } from '@/types/database'
import { signOut } from '@/lib/actions/auth'
import { updateProfileSchoolYear } from '@/lib/actions/profile'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ProfileContentProps {
  profile: Profile | null
  widgets: (Widget & {
    profiles?: Profile
    original_widget?: Widget & { profiles?: Profile }
  })[]
  isOwner?: boolean
  currentUserId?: string
}

const POST = 'posts'
const REPOSTS = 'reposts'

export function ProfileContent({ profile, widgets, isOwner = false, currentUserId }: ProfileContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts'>(POST)
  const [schoolYear, setSchoolYear] = useState(profile?.school_year ?? '')
  const [editingSchoolYear, setEditingSchoolYear] = useState(false)
  const [savingSchoolYear, setSavingSchoolYear] = useState(false)
  const router = useRouter()

  const posts = widgets.filter(w => w.type !== 'repost')
  const reposts = widgets.filter(w => w.type === 'repost')
  const displayWidgets = activeTab === REPOSTS ? reposts : posts

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  const handleSaveSchoolYear = async () => {
    setSavingSchoolYear(true)
    const result = await updateProfileSchoolYear(schoolYear.trim() || null)
    setSavingSchoolYear(false)
    setEditingSchoolYear(false)
    if (result.error) toast.error(result.error)
    else {
      toast.success('Updated')
      router.refresh()
    }
  }

  const profileUsername = profile?.username ?? ''

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg z-10 safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Profile</h1>
          {isOwner && (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile info */}
      <div className="px-4 py-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20 shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {profile?.username?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">
              {profile?.display_name || profile?.username || 'Unknown'}
            </h2>
            <p className="text-sm text-muted-foreground truncate">@{profile?.username || 'unknown'}</p>
            {profile?.bio && <p className="text-sm mt-2">{profile.bio}</p>}
            {/* School year: editable by owner */}
            <div className="mt-2">
              {isOwner ? (
                editingSchoolYear ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={schoolYear}
                      onChange={(e) => setSchoolYear(e.target.value)}
                      placeholder="e.g. Senior, Class of 2025"
                      className="h-9 text-sm max-w-[180px]"
                    />
                    <Button size="sm" onClick={handleSaveSchoolYear} disabled={savingSchoolYear}>
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingSchoolYear(false); setSchoolYear(profile?.school_year ?? '') }}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingSchoolYear(true)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {profile?.school_year || 'Add school year'}
                  </button>
                )
              ) : (
                profile?.school_year && (
                  <p className="text-sm text-muted-foreground">{profile.school_year}</p>
                )
              )}
            </div>
          </div>
        </div>

        {!isOwner && currentUserId && profileUsername && (
          <Link href={`/chat?with=${encodeURIComponent(profileUsername)}`} className="mt-4 inline-block">
            <Button variant="outline" size="sm" className="rounded-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          </Link>
        )}

        {/* Tabs: Posts | Reposts */}
        <div className="flex gap-4 mt-4 border-b border-border/50">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reposts')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reposts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Reposts ({reposts.length})
          </button>
        </div>
      </div>

      {/* Widgets grid */}
      <div className="px-4">
        <WidgetGrid widgets={displayWidgets} isOwner={isOwner} />
      </div>

      {/* Floating add button */}
      {isOwner && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 left-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-[60]"
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
