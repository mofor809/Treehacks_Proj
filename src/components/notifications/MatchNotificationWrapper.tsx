'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface AIMatch {
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  sharedInterests: Record<string, string>
  matchScore: number
  conversationStarter: string | null
}

interface MatchNotificationWrapperProps {
  matches: AIMatch[]
}

export function MatchNotificationWrapper({ matches }: MatchNotificationWrapperProps) {
  const [currentMatch, setCurrentMatch] = useState<AIMatch | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // Only show once per session
    if (hasShown || matches.length === 0) return

    // Pick a random match to show
    const randomMatch = matches[Math.floor(Math.random() * matches.length)]
    setCurrentMatch(randomMatch)

    // Show after a delay
    const timer = setTimeout(() => {
      setIsVisible(true)
      setHasShown(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [matches, hasShown])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => setCurrentMatch(null), 300)
  }

  if (!currentMatch) return null

  const sharedInterestsList = Object.keys(currentMatch.sharedInterests)
  const topInterest = sharedInterestsList[0]
  const explanation = currentMatch.sharedInterests[topInterest]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-4 right-4 z-[9999] safe-area-inset-top"
        >
          <Card className="p-4 bg-background/95 backdrop-blur-xl bevel-lg shadow-2xl border border-primary/30">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-primary">
                  Someone shares your vibe!
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
              <Avatar className="w-12 h-12 ring-2 ring-white/60">
                <AvatarImage src={currentMatch.avatarUrl || undefined} />
                <AvatarFallback className="gradient-primary text-white font-medium">
                  {currentMatch.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {currentMatch.displayName || currentMatch.username}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  @{currentMatch.username}
                </p>
              </div>
            </div>

            {/* Shared interest highlight */}
            <div className="bg-primary/10 rounded-xl p-3 mb-3">
              <p className="text-xs text-muted-foreground mb-1">You both share</p>
              <p className="font-medium text-primary">{topInterest}</p>
              {explanation && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {explanation}
                </p>
              )}
            </div>

            {/* Conversation starter */}
            {currentMatch.conversationStarter && (
              <p className="text-sm text-muted-foreground italic mb-3 line-clamp-2">
                &ldquo;{currentMatch.conversationStarter}&rdquo;
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Link href={`/profile/${encodeURIComponent(currentMatch.username)}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full rounded-full">
                  View Profile
                </Button>
              </Link>
              <Link href={`/chat?with=${encodeURIComponent(currentMatch.username)}`} className="flex-1">
                <Button size="sm" className="w-full rounded-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
