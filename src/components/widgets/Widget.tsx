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
      toast.success('Widget deleted')
      onDelete?.()
    }
  }

  const renderContent = () => {
    if (widget.type === 'repost' && widget.original_widget) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Repeat2 className="w-3.5 h-3.5" />
            <span className="font-medium">Reposted</span>
          </div>
          <div className="p-3 rounded-2xl glass-subtle">
            {widget.original_widget.profiles && (
              <div className="flex items-center gap-2 mb-2">
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
            {widget.original_widget.type === 'image' && widget.original_widget.image_url && (
              <img
                src={widget.original_widget.image_url}
                alt=""
                className="w-full rounded-xl mb-2 object-cover max-h-40"
              />
            )}
            {widget.original_widget.content && (
              <p className="text-sm leading-relaxed">{widget.original_widget.content}</p>
            )}
          </div>
        </div>
      )
    }

    if (widget.type === 'image' && widget.image_url) {
      return (
        <div className="space-y-3">
          <img
            src={widget.image_url}
            alt=""
            className="w-full rounded-2xl object-cover"
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
      <div className="glass bevel rounded-3xl p-4 relative overflow-hidden">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-4 right-4 h-[1px] gradient-primary opacity-20" />

        {/* User info */}
        {showUser && widget.profiles && (
          <div className="flex items-center gap-2.5 mb-3">
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

        {/* Content */}
        {renderContent()}

        {/* Interest tags */}
        {widget.interest_tags && widget.interest_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {widget.interest_tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-[11px] font-medium gradient-primary-subtle text-[#3D3A7E] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Owner menu */}
        {isOwner && (
          <div className="absolute top-3 right-3">
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
                  Delete
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
