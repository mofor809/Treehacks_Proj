'use client'

import { motion } from 'framer-motion'
import { MoreHorizontal, Repeat2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteWidget(widget.id)
    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
    } else {
      toast.success('Post deleted')
      onDelete?.()
      router.refresh()
    }
  }

  const isRepost = widget.type === 'repost' && widget.original_widget
  const isImagePost = widget.type === 'image' && widget.image_url
  const isRepostImage = isRepost && widget.original_widget?.type === 'image' && widget.original_widget?.image_url


  // Image-focused layout for photo posts
  if (isImagePost || isRepostImage) {
    const imageUrl = isRepostImage ? widget.original_widget!.image_url! : widget.image_url!
    const caption = isRepostImage ? widget.original_widget!.content : widget.content
    const tags = isRepost ? widget.original_widget?.interest_tags : widget.interest_tags

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
        <div className="relative overflow-hidden rounded-xl bevel-lg shadow-md">
          {/* Main image - natural aspect ratio */}
          <img
            src={imageUrl}
            alt=""
            className="w-full object-cover"
            loading="lazy"
          />

          {/* Gradient overlay at bottom for text */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent pt-8 pb-2 px-2">
            {/* Repost indicator */}
            {isRepost && widget.original_widget?.profiles && (
              <div className="flex items-center gap-1 mb-1">
                <Repeat2 className="w-2.5 h-2.5 text-white/80" />
                <Avatar className="w-3 h-3 ring-1 ring-white/50">
                  <AvatarImage src={widget.original_widget.profiles.avatar_url || undefined} />
                  <AvatarFallback className="text-[6px] gradient-primary text-white">
                    {widget.original_widget.profiles.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[8px] text-white/80">
                  @{widget.original_widget.profiles.username}
                </span>
              </div>
            )}

            {/* Caption */}
            {caption && (
              <p className="text-[10px] text-white leading-snug line-clamp-2">{caption}</p>
            )}

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-0.5 mt-1">
                {tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-[8px] font-medium bg-white/20 backdrop-blur-sm text-white rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Owner menu - top right */}
          {isOwner && (
            <div className="absolute top-1.5 right-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 mt-1 glass bevel rounded-xl p-1 z-10 min-w-[90px]"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg text-xs h-7"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-3 h-3 mr-1.5" />
                    {isDeleting ? '...' : 'Delete'}
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // Text-only layout
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
      <div className="glass bevel-lg rounded-xl p-3 relative overflow-hidden min-h-[60px] shadow-sm">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-2 right-2 h-[1px] gradient-primary opacity-20" />

        {/* Repost header with original poster info */}
        {isRepost && widget.original_widget?.profiles && (
          <div className="flex items-center gap-1 mb-1.5 pb-1.5 border-b border-border/30">
            <Repeat2 className="w-2.5 h-2.5 text-muted-foreground" />
            <Avatar className="w-3.5 h-3.5 ring-1 ring-white/50">
              <AvatarImage src={widget.original_widget.profiles.avatar_url || undefined} />
              <AvatarFallback className="text-[7px] gradient-primary text-white">
                {widget.original_widget.profiles.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-[9px] font-medium text-muted-foreground">
              @{widget.original_widget.profiles.username}
            </span>
          </div>
        )}

        {/* User info */}
        {showUser && widget.profiles && !isRepost && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Avatar className="w-4 h-4 ring-1 ring-white/60">
              <AvatarImage src={widget.profiles.avatar_url || undefined} />
              <AvatarFallback className="text-[8px] gradient-primary text-white font-medium">
                {widget.profiles.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-medium">
              @{widget.profiles.username}
            </span>
          </div>
        )}

        {/* Content - add right padding when owner to avoid overlap with menu */}
        <div className={isOwner ? 'pr-5' : ''}>
          <p className="text-[13px] leading-relaxed">
            {isRepost ? widget.original_widget?.content : widget.content}
          </p>
        </div>

        {/* Interest tags */}
        {(() => {
          const tags = isRepost ? widget.original_widget?.interest_tags : widget.interest_tags
          return tags && tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-[8px] font-medium gradient-primary-subtle text-[#3D3A7E] rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null
        })()}

        {/* Owner menu */}
        {isOwner && (
          <div className="absolute top-1.5 right-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-full glass-subtle"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 mt-1 glass bevel rounded-xl p-1 z-10 min-w-[90px]"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg text-xs h-7"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3 h-3 mr-1.5" />
                  {isDeleting ? '...' : 'Delete'}
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
