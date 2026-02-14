'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Repeat2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Widget, Profile } from '@/types/database'
import { repostWidget } from '@/lib/actions/widgets'
import { toast } from 'sonner'

interface FeedCardProps {
  widget: Widget & {
    profiles?: Profile
    original_widget?: Widget & { profiles?: Profile }
  }
  currentUserId?: string
}

export function FeedCard({ widget, currentUserId }: FeedCardProps) {
  const [showUser, setShowUser] = useState(false)
  const [isReposting, setIsReposting] = useState(false)

  const isOwn = currentUserId === widget.user_id

  const handleRepost = async () => {
    if (isOwn) {
      toast.error("You can't repost your own content")
      return
    }

    setIsReposting(true)
    const result = await repostWidget(widget.id)
    setIsReposting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Added to your profile')
    }
  }

  const renderContent = () => {
    // Handle repost type
    if (widget.type === 'repost' && widget.original_widget) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Repeat2 className="w-3.5 h-3.5" />
            <span className="font-medium">
              {showUser ? `@${widget.profiles?.username}` : 'Someone'} reposted
            </span>
          </div>
          <div className="p-4 rounded-2xl glass-subtle">
            {widget.original_widget.type === 'image' && widget.original_widget.image_url && (
              <img
                src={widget.original_widget.image_url}
                alt=""
                className="w-full rounded-xl mb-3 object-cover"
              />
            )}
            {widget.original_widget.content && (
              <p className="text-[15px] leading-relaxed">{widget.original_widget.content}</p>
            )}
          </div>
        </div>
      )
    }

    // Image widget
    if (widget.type === 'image' && widget.image_url) {
      return (
        <div className="space-y-4">
          <img
            src={widget.image_url}
            alt=""
            className="w-full rounded-2xl object-cover"
            loading="lazy"
          />
          {widget.content && (
            <p className="text-[15px] leading-relaxed">{widget.content}</p>
          )}
        </div>
      )
    }

    // Text widget
    return (
      <p className="text-[15px] leading-[1.6]">{widget.content}</p>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="glass bevel-lg rounded-[28px] p-5 overflow-hidden relative">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-24 gradient-primary opacity-[0.03] pointer-events-none" />

        {/* User info (hidden by default - tap to reveal) */}
        <motion.div
          initial={false}
          animate={{
            height: showUser ? 'auto' : 0,
            opacity: showUser ? 1 : 0,
            marginBottom: showUser ? 16 : 0
          }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border/50">
            <Avatar className="w-10 h-10 ring-2 ring-white/70 bevel-sm">
              <AvatarImage src={widget.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-sm gradient-primary text-white font-medium">
                {widget.profiles?.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">
                {widget.profiles?.display_name || widget.profiles?.username}
              </p>
              <p className="text-xs text-muted-foreground">
                @{widget.profiles?.username}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="relative z-10">
          {renderContent()}
        </div>

        {/* Interest tags */}
        {widget.interest_tags && widget.interest_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {widget.interest_tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 text-xs font-medium gradient-primary-subtle text-[#3D3A7E] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUser(!showUser)}
            className="text-muted-foreground hover:text-foreground rounded-full px-4 h-9 active-scale"
          >
            {showUser ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                <span className="text-xs font-medium">Hide</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                <span className="text-xs font-medium">Reveal</span>
              </>
            )}
          </Button>

          {!isOwn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRepost}
              disabled={isReposting}
              className="text-muted-foreground hover:text-foreground rounded-full px-4 h-9 active-scale"
            >
              <Repeat2 className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium">Repost</span>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
