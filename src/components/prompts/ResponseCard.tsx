'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Repeat2, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PromptResponse, Profile } from '@/types/database'
import { repostWidget } from '@/lib/actions/widgets'
import { toast } from 'sonner'

interface ResponseCardProps {
  response: PromptResponse & {
    profiles?: Profile
  }
  currentUserId?: string
}

export function ResponseCard({ response, currentUserId }: ResponseCardProps) {
  const [showUser, setShowUser] = useState(false)

  const isOwn = currentUserId === response.user_id

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4">
        {/* User info (hidden by default) */}
        <motion.div
          initial={false}
          animate={{ height: showUser ? 'auto' : 0, opacity: showUser ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
            <Avatar className="w-6 h-6">
              <AvatarImage src={response.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {response.profiles?.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              @{response.profiles?.username}
            </span>
          </div>
        </motion.div>

        {/* Content */}
        <p className="text-sm leading-relaxed">{response.content}</p>

        {/* Image if present */}
        {response.image_url && (
          <img
            src={response.image_url}
            alt=""
            className="w-full rounded-lg mt-3 object-cover"
            loading="lazy"
          />
        )}

        {/* Interest tags */}
        {response.interest_tags && response.interest_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {response.interest_tags.map((tag) => (
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
        </div>
      </Card>
    </motion.div>
  )
}
