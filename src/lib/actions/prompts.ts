'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { extractInterests } from '@/lib/interests'

export async function submitPromptResponse(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const promptId = formData.get('promptId') as string
  const content = formData.get('content') as string
  const imageUrl = formData.get('imageUrl') as string | null

  if (!content?.trim()) {
    return { error: 'Please enter a response' }
  }

  // Extract interests from content
  const interestTags = extractInterests(content)

  const { data, error } = await (supabase
    .from('prompt_responses') as any)
    .upsert({
      prompt_id: promptId,
      user_id: user.id,
      content,
      image_url: imageUrl,
      interest_tags: interestTags,
    }, {
      onConflict: 'prompt_id,user_id'
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/prompts')
  return { data }
}

export async function getTodayPrompt() {
  const supabase = await createClient()

  // Try to get today's prompt
  const today = new Date().toISOString().split('T')[0]

  const { data: todayPrompt } = await supabase
    .from('prompts')
    .select('*')
    .eq('active_date', today)
    .eq('type', 'daily')
    .single()

  if (todayPrompt) {
    return { data: todayPrompt }
  }

  // Fallback to any random prompt
  const { data: randomPrompt } = await supabase
    .from('prompts')
    .select('*')
    .limit(1)
    .single()

  return { data: randomPrompt }
}

export async function getPromptResponses(promptId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prompt_responses')
    .select(`
      *,
      profiles!prompt_responses_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('prompt_id', promptId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data }
}
