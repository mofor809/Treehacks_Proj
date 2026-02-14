'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Profile } from '@/types/database'
import Link from 'next/link'

interface MatchData {
  id: string
  shared_tags: string[]
  conversation_starter: string
  otherUser: Profile
}

interface MatchNotificationProps {
  match: MatchData
  onDismiss: () => void
}

export function MatchNotification({ match, onDismiss }: MatchNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onDismiss, 300)
    }, 10000) // Auto-dismiss after 10 seconds

    return () => clearTimeout(timer)
  }, [onDismiss])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-4 right-4 z-50 safe-area-inset-top"
        >
          <Card className="p-4 bg-card border-primary/30 shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">
                  New Match!
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-1 -mt-1"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={match.otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {match.otherUser.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {match.otherUser.display_name || match.otherUser.username}
                </p>
                <p className="text-sm text-muted-foreground">
                  @{match.otherUser.username}
                </p>
              </div>
            </div>

            {/* Shared interests */}
            <p className="text-sm mb-2">You both like:</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {match.shared_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Conversation starter */}
            <p className="text-sm text-muted-foreground italic mb-3">
              &ldquo;{match.conversation_starter}&rdquo;
            </p>

            {/* Action */}
            <Link href="/chat">
              <Button className="w-full active-scale" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Conversation
              </Button>
            </Link>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
