import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ResponseForm } from '@/components/prompts/ResponseForm'
import { ResponseCard } from '@/components/prompts/ResponseCard'
import { Sun } from 'lucide-react'
import { Prompt, PromptResponse, Profile } from '@/types/database'

type PromptResponseWithProfile = PromptResponse & {
  profiles: Profile | null
}

export default async function PromptsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get today's prompt
  const today = new Date().toISOString().split('T')[0]

  let { data: promptData } = await supabase
    .from('prompts')
    .select('*')
    .eq('active_date', today)
    .eq('type', 'daily')
    .single()

  // Fallback to any prompt if no daily prompt
  if (!promptData) {
    const { data: fallbackPrompt } = await supabase
      .from('prompts')
      .select('*')
      .limit(1)
      .single()
    promptData = fallbackPrompt
  }

  const prompt = promptData as Prompt | null

  // Get responses for this prompt
  let responses: PromptResponseWithProfile[] = []
  let userResponse: string | undefined

  if (prompt) {
    const { data: promptResponses } = await supabase
      .from('prompt_responses')
      .select(`
        *,
        profiles:profiles!prompt_responses_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('prompt_id', prompt.id)
      .order('created_at', { ascending: false })

    responses = (promptResponses ?? []) as unknown as PromptResponseWithProfile[]

    // Check if user has already responded
    const existingResponse = responses.find(r => r.user_id === user?.id)
    userResponse = existingResponse?.content ?? undefined
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg z-10 safe-area-inset-top">
        <div className="flex items-center justify-center px-4 py-3">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Daily Prompt</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Today's Prompt */}
        {prompt ? (
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <p className="text-xs text-primary font-medium uppercase tracking-wide mb-2">
              Today&apos;s Question
            </p>
            <h2 className="text-xl font-semibold leading-relaxed">
              {prompt.question}
            </h2>
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              What has inspired you this week?
            </p>
          </Card>
        )}

        {/* Response Form */}
        {prompt && (
          <div>
            <h3 className="text-sm font-medium mb-3">
              {userResponse ? 'Update your response' : 'Your response'}
            </h3>
            <ResponseForm
              promptId={prompt.id}
              existingResponse={userResponse}
            />
          </div>
        )}

        {/* Responses */}
        {responses.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">
              Responses ({responses.length})
            </h3>
            <div className="space-y-3">
              {responses.map((response) => (
                <ResponseCard
                  key={response.id}
                  response={response as any}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          </div>
        )}

        {responses.length === 0 && prompt && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Be the first to respond to today&apos;s prompt!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
