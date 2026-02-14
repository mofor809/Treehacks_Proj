'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitPromptResponse } from '@/lib/actions/prompts'
import { toast } from 'sonner'

interface ResponseFormProps {
  promptId: string
  existingResponse?: string
}

export function ResponseForm({ promptId, existingResponse }: ResponseFormProps) {
  const [content, setContent] = useState(existingResponse || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('Please enter a response')
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.set('promptId', promptId)
    formData.set('content', content)

    const result = await submitPromptResponse(formData)

    setIsSubmitting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Response submitted!')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Share your thoughts..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="resize-none"
        maxLength={500}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {content.length}/500
        </span>
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          size="sm"
          className="active-scale"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Respond
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
