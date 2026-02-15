'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient, sendMessageClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Message, Profile } from '@/types/database'

type MessageWithSender = Message & { sender?: Profile }

interface ConversationViewProps {
  conversationId: string
  initialMessages: MessageWithSender[]
  currentUserId: string
  postId: string | null
  isGroup: boolean
}

export function ConversationView({
  conversationId,
  initialMessages,
  currentUserId,
  postId,
  isGroup,
}: ConversationViewProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription for new messages
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const msg = payload.new as Message

          const { data: sender } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', msg.sender_id)
            .single()

          setMessages((prev) => [
            ...prev,
            { ...msg, sender: sender as unknown as Profile },
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  // Send message (client-side)
  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    setSending(true)
    setInput('')

    const supabase = createClient()
    const { error } = await sendMessageClient(conversationId, text, postId)

    setSending(false)

    if (error) {
      toast.error(error.message)
      setInput(text)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm">
            No messages yet. Say hi!
          </p>
        )}
  
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId
  
          return (
            <div
              key={m.id}
              className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
            >
              {!isMe && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={m.sender?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {m.sender?.username?.[0]?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
              )}
  
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  isMe
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {!isMe && isGroup && m.sender?.username && (
                  <p className="text-xs font-medium opacity-80 mb-0.5">
                    @{m.sender.username}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {m.content}
                </p>
              </div>
            </div>
          )
        })}
  
        <div ref={bottomRef} />
      </div>
  
      {/* Input (always visible) */}
      <div className="shrink-0 p-4 border-t bg-background pb-[env(safe-area-inset-bottom)]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message..."
            className="flex-1 rounded-full"
          />
          <Button
            type="submit"
            disabled={sending || !input.trim()}
            size="icon"
            className="rounded-full shrink-0"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}