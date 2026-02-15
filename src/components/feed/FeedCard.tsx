'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Repeat2, MessageCircle, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Widget, Profile } from '@/types/database'
import { repostWidget } from '@/lib/actions/widgets'
import { createGroupChatForPost } from '@/lib/actions/conversations'
import { toast } from 'sonner'

interface FeedCardProps {
  widget: Widget & {
    profiles?: Profile
    original_widget?: Widget & { profiles?: Profile }
  }
  currentUserId?: string
}

export function FeedCard({ widget, currentUserId }: FeedCardProps) {
  const [isReposting, setIsReposting] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)

  const isOwn = currentUserId === widget.user_id
  const authorUsername = widget.profiles?.username ?? null
  const profilePath = authorUsername ? `/profile/${encodeURIComponent(authorUsername)}` : null

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

  const handleCreateGroupChat = async () => {
    if (!isOwn) return
    setIsCreatingGroup(true)
    const result = await createGroupChatForPost(widget.id)
    setIsCreatingGroup(false)
    if (result.error) {
      toast.error(result.error)
    } else if (result.data?.conversationId) {
      toast.success('Group chat created')
      window.location.href = `/chat/${result.data.conversationId}`
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
              @{widget.profiles?.username ?? 'someone'} reposted
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

        {/* Author: always visible, clickable to profile */}
        <div className="flex items-center gap-3 pb-4 border-b border-border/50">
          <Avatar className="w-10 h-10 ring-2 ring-white/70 bevel-sm shrink-0">
            <AvatarImage src={widget.profiles?.avatar_url || undefined} />
            <AvatarFallback className="text-sm gradient-primary text-white font-medium">
              {widget.profiles?.username?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            {profilePath ? (
              <Link href={profilePath} className="block hover:opacity-80 transition-opacity">
                <p className="text-sm font-semibold truncate">
                  {widget.profiles?.display_name || widget.profiles?.username || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{widget.profiles?.username}</p>
              </Link>
            ) : (
              <>
                <p className="text-sm font-semibold truncate">
                  {widget.profiles?.display_name || widget.profiles?.username || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{widget.profiles?.username ?? 'unknown'}</p>
              </>
            )}
          </div>
        </div>

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
        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-border/40">
          {isOwn ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateGroupChat}
              disabled={isCreatingGroup}
              className="text-muted-foreground hover:text-foreground rounded-full px-4 h-9 active-scale"
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium">Group chat</span>
            </Button>
          ) : (
            <>
              <Link href={profilePath ? `/chat?with=${encodeURIComponent(authorUsername!)}&post=${widget.id}` : '#'}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground rounded-full px-4 h-9 active-scale"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">Message</span>
                </Button>
              </Link>
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
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
