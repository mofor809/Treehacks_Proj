'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { getMessages, sendMessage as sendMessageServer } from '@/lib/actions/conversations'
import type { Message, Profile } from '@/types/database'

export default function ChatPage() {
  const router = useRouter()
  const { id } = router.query
  const [messages, setMessages] = useState<(Message & { sender?: Profile })[]>([])
  const [message, setMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch messages
  useEffect(() => {
    if (!id) return
    const fetch = async () => {
      const { data, error } = await getMessages(id as string)
      if (error) return console.error(error)
      setMessages(data ?? [])
    }
    fetch()
  }, [id])

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!message.trim() || !id) return

    // Optimistic UI update
    const newMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: message,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, newMessage as any])
    setMessage('')

    // Persist via server function
    const { error } = await sendMessageServer(id as string, newMessage.content)
    if (error) console.error(error)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Messages list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground mt-4">No messages yet. Say hi!</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded-lg max-w-xs ${
              m.sender_id === 'me' ? 'bg-primary text-white ml-auto' : 'bg-muted text-black'
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      {/* Input box */}
      <div className="p-4 border-t flex gap-2 bg-white">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={sendMessage}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  )
}

