'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Repeat2, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
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
      toast.error("You can't repost your own widget")
      return
    }

    setIsReposting(true)
    const result = await repostWidget(widget.id)
    setIsReposting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Reposted to your profile!')
    }
  }

  const renderContent = () => {
    // Handle repost type
    if (widget.type === 'repost' && widget.original_widget) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Repeat2 className="w-3 h-3" />
            <span>
              {showUser ? `@${widget.profiles?.username}` : 'Someone'} reposted
            </span>
          </div>
          <Card className="p-3 bg-secondary/50 border-0">
            {widget.original_widget.type === 'image' && widget.original_widget.image_url && (
              <img
                src={widget.original_widget.image_url}
                alt=""
                className="w-full rounded-lg mb-2 object-cover"
              />
            )}
            {widget.original_widget.content && (
              <p className="text-sm">{widget.original_widget.content}</p>
            )}
          </Card>
        </div>
      )
    }

    // Image widget
    if (widget.type === 'image' && widget.image_url) {
      return (
        <div className="space-y-3">
          <img
            src={widget.image_url}
            alt=""
            className="w-full rounded-xl object-cover"
            loading="lazy"
          />
          {widget.content && (
            <p className="text-sm">{widget.content}</p>
          )}
        </div>
      )
    }

    // Text widget
    return (
      <p className="text-base leading-relaxed">{widget.content}</p>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 overflow-hidden">
        {/* User info (hidden by default - tap to reveal) */}
        <motion.div
          initial={false}
          animate={{ height: showUser ? 'auto' : 0, opacity: showUser ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
            <Avatar className="w-8 h-8">
              <AvatarImage src={widget.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {widget.profiles?.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {widget.profiles?.display_name || widget.profiles?.username}
              </p>
              <p className="text-xs text-muted-foreground">
                @{widget.profiles?.username}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {renderContent()}

        {/* Interest tags */}
        {widget.interest_tags && widget.interest_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {widget.interest_tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUser(!showUser)}
            className="text-muted-foreground"
          >
            <Eye className="w-4 h-4 mr-1" />
            {showUser ? 'Hide' : 'Reveal'}
          </Button>

          {!isOwn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRepost}
              disabled={isReposting}
              className="text-muted-foreground"
            >
              <Repeat2 className="w-4 h-4 mr-1" />
              Repost
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
