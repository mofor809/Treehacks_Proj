'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

type Message = {
  id: string
  senderId: string
  content: string
  createdAt: string
}

export default function ChatPage() {
  const router = useRouter()
  const { id } = router.query
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Example: fetch messages when chat id changes
  useEffect(() => {
    if (!id) return

    // Replace with your API call
    setMessages([
      { id: '1', senderId: 'user1', content: 'Hello!', createdAt: '2026-02-14T10:00' },
      { id: '2', senderId: 'me', content: 'Hi there!', createdAt: '2026-02-14T10:01' },
    ])
  }, [id])

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!message.trim()) return

    // Add message locally
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), senderId: 'me', content: message, createdAt: new Date().toISOString() },
    ])
    setMessage('')

    // TODO: call your API to persist the message
    console.log(`Send message to conversation ${id}: ${message}`)
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
              m.senderId === 'me' ? 'bg-primary text-white ml-auto' : 'bg-muted text-black'
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="p-4 border-t flex gap-2">
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
