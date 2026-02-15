'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
        alert(`Error: ${error || 'Failed to create conversation'}`)
        setLoading(false)
        return
      }

      const { conversationId } = data
      console.log('Navigating to:', `/chat/${conversationId}`)
      router.push(`/chat/${conversationId}`)
    } catch (err) {
      console.error('Unexpected error:', err)
      alert(`Unexpected error: ${err}`)
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

