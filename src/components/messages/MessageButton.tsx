'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { getOrCreateDmWithUsername } from '@/lib/actions/conversations'
import { Button } from '@/components/ui/button'

type Props = {
  username: string
  postId?: string | null
}

export default function MessageButton({ username, postId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const { data, error } = await getOrCreateDmWithUsername(username)
      if (error || !data) {
        console.error('Failed to get/create conversation', error)
        return
      }

      const { conversationId } = data
      router.push(`/chat/${conversationId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="bg-primary text-white px-4 py-2 rounded"
    >
      {loading ? 'Loading...' : 'Message'}
    </Button>
  )
}

