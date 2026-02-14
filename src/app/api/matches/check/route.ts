import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkForMatches } from '@/lib/actions/matches'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tags } = await request.json()

    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json({ error: 'Invalid tags' }, { status: 400 })
    }

    const result = await checkForMatches(user.id, tags)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Match check error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
