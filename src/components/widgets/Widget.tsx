'use client'

import { motion } from 'framer-motion'
import { MoreHorizontal, Repeat2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Widget as WidgetType, Profile } from '@/types/database'
import { deleteWidget } from '@/lib/actions/widgets'
import { toast } from 'sonner'

interface WidgetProps {
  widget: WidgetType & {
    profiles?: Profile
    original_widget?: WidgetType & { profiles?: Profile }
  }
  isOwner?: boolean
  showUser?: boolean
  onDelete?: () => void
}

export function Widget({ widget, isOwner = false, showUser = false, onDelete }: WidgetProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteWidget(widget.id)
    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
    } else {
      toast.success('Post deleted')
      onDelete?.()
    }
  }

  const isRepost = widget.type === 'repost' && widget.original_widget

  const renderContent = () => {
    // For reposts, render the original widget's content directly
    if (isRepost) {
      const original = widget.original_widget!
      if (original.type === 'image' && original.image_url) {
        return (
          <div className="space-y-2">
            <img
              src={original.image_url}
              alt=""
              className="w-full rounded-xl object-contain max-h-64"
              loading="lazy"
            />
            {original.content && (
              <p className="text-sm leading-relaxed">{original.content}</p>
            )}
          </div>
        )
      }
      return (
        <p className="text-sm leading-relaxed">{original.content}</p>
      )
    }

    if (widget.type === 'image' && widget.image_url) {
      return (
        <div className="space-y-2">
          <img
            src={widget.image_url}
            alt=""
            className="w-full rounded-xl object-contain max-h-64"
            loading="lazy"
          />
          {widget.content && (
            <p className="text-sm leading-relaxed">{widget.content}</p>
          )}
        </div>
      )
    }

    return (
      <p className="text-sm leading-relaxed">{widget.content}</p>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="glass bevel rounded-2xl p-2.5 relative overflow-hidden min-h-[60px]">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-2.5 right-2.5 h-[1px] gradient-primary opacity-20" />

        {/* Repost header with original poster info */}
        {isRepost && widget.original_widget?.profiles && (
          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border/30">
            <Repeat2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Reposted from</span>
            <Avatar className="w-5 h-5 ring-1 ring-white/50">
              <AvatarImage src={widget.original_widget.profiles.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] gradient-primary text-white">
                {widget.original_widget.profiles.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground">
              @{widget.original_widget.profiles.username}
            </span>
          </div>
        )}

        {/* User info */}
        {showUser && widget.profiles && !isRepost && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-7 h-7 ring-2 ring-white/60">
              <AvatarImage src={widget.profiles.avatar_url || undefined} />
              <AvatarFallback className="text-xs gradient-primary text-white font-medium">
                {widget.profiles.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              @{widget.profiles.username}
            </span>
          </div>
        )}

        {/* Content - add right padding when owner to avoid overlap with menu */}
        <div className={isOwner ? 'pr-7' : ''}>
          {renderContent()}
        </div>

        {/* Interest tags - use original widget's tags for reposts */}
        {(() => {
          const tags = isRepost ? widget.original_widget?.interest_tags : widget.interest_tags
          return tags && tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-[11px] font-medium gradient-primary-subtle text-[#3D3A7E] rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null
        })()}

        {/* Owner menu */}
        {isOwner && (
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full glass-subtle"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 mt-1 glass bevel rounded-2xl p-1.5 z-10 min-w-[120px]"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete post'}
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
