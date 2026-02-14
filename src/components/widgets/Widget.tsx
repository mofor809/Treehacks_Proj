'use client'

import { motion } from 'framer-motion'
import { MoreHorizontal, Repeat2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
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
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Repeat2 className="w-3 h-3" />
            <span>Reposted</span>
          </div>
          <Card className="p-3 bg-secondary/50 border-0">
            {widget.original_widget.profiles && (
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={widget.original_widget.profiles.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {widget.original_widget.profiles.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">
                  @{widget.original_widget.profiles.username}
                </span>
              </div>
            )}
            {widget.original_widget.type === 'image' && widget.original_widget.image_url && (
              <img
                src={widget.original_widget.image_url}
                alt=""
                className="w-full rounded-lg mb-2 object-cover max-h-40"
              />
            )}
            {widget.original_widget.content && (
              <p className="text-sm">{widget.original_widget.content}</p>
            )}
          </Card>
        </div>
      )
    }

    if (widget.type === 'image' && widget.image_url) {
      return (
        <div className="space-y-2">
          <img
            src={widget.image_url}
            alt=""
            className="w-full rounded-lg object-cover"
            loading="lazy"
          />
          {widget.content && (
            <p className="text-sm">{widget.content}</p>
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 relative overflow-hidden">
        {/* User info */}
        {showUser && widget.profiles && (
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="w-6 h-6">
              <AvatarImage src={widget.profiles.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
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

        {/* Owner menu */}
        {isOwner && (
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 mt-1 bg-card border rounded-lg shadow-lg p-1 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
