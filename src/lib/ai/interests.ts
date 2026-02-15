/**
 * Wavelength AI Interest Extraction & Matching Module (TypeScript)
 *
 * This module provides AI-powered semantic interest extraction and matching
 * using Claude (Anthropic) for deep understanding of user content.
 *
 * Used for real-time extraction when users create posts.
 */

import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// =============================================================================
// INTEREST NORMALIZATION
// =============================================================================
// Maps common variations/synonyms to canonical interest terms
// This ensures consistent matching across different phrasings

const INTEREST_NORMALIZATION_MAP: Record<string, string> = {
  // Beauty & Style
  makeup: 'beauty & self-expression',
  cosmetics: 'beauty & self-expression',
  skincare: 'beauty & self-expression',
  fashion: 'fashion & style',
  clothing: 'fashion & style',
  streetwear: 'fashion & style',
  outfits: 'fashion & style',

  // Photography & Visual Arts
  photography: 'photography',
  photos: 'photography',
  'golden hour': 'photography',
  portraits: 'portrait photography',
  'street photography': 'street photography',
  'aesthetic photos': 'visual aesthetics',
  aesthetics: 'visual aesthetics',

  // Music
  'indie music': 'indie & alternative music',
  'alternative music': 'indie & alternative music',
  'niche music': 'indie & alternative music',
  'underground music': 'indie & alternative music',

  // Tech & Coding
  coding: 'software development',
  programming: 'software development',
  software: 'software development',
  tech: 'technology',
  ai: 'artificial intelligence',
  'machine learning': 'artificial intelligence',

  // Sports & Fitness
  running: 'running & cardio',
  jogging: 'running & cardio',
  snowboarding: 'winter sports',
  skiing: 'winter sports',
  fitness: 'health & fitness',
  gym: 'health & fitness',
  workout: 'health & fitness',
}

/**
 * Normalize an interest term to its canonical form.
 */
function normalizeInterest(interest: string): string {
  const lower = interest.toLowerCase().trim()
  return INTEREST_NORMALIZATION_MAP[lower] || lower
}

/**
 * Extract semantic interests from a list of user posts using AI analysis.
 *
 * @param posts - List of post content strings (text or image descriptions)
 * @param maxInterests - Maximum number of interests to return (default: 10)
 * @returns List of normalized, canonical interest strings
 *
 * @example
 * const interests = await extractInterestsAI([
 *   "Just posted a golden hour shot of the city",
 *   "I love indie music and street fashion"
 * ])
 * // Returns: ["street photography", "urban aesthetics", "indie & alternative music", "fashion & style"]
 */
export async function extractInterestsAI(
  posts: string[],
  maxInterests: number = 10
): Promise<string[]> {
  if (!posts || posts.every((p) => !p)) {
    return []
  }

  // Combine posts for analysis
  const combinedContent = posts.filter((p) => p).join('\n---\n')

  const prompt = `Analyze the following user posts and extract their interests, hobbies, and passions.

USER POSTS:
${combinedContent}

INSTRUCTIONS:
1. Identify specific interests based on explicit mentions AND implicit themes
2. Be specific rather than generic (e.g., "street photography" not just "photography")
3. Consider the overall vibe and personality shown
4. Look for patterns across multiple posts
5. Include both active hobbies and passive interests
6. Normalize similar concepts (e.g., "makeup" and "beauty" -> "beauty & self-expression")

Return a JSON array of ${maxInterests} or fewer interest strings.
Be specific and descriptive. Focus on interests that could connect this person with others.

Example output format:
["street photography", "indie music", "urban fashion", "coffee culture", "night owl lifestyle"]

Return ONLY the JSON array, no other text.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    // Parse the response
    const responseText =
      response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    let interests: string[]

    if (jsonMatch) {
      interests = JSON.parse(jsonMatch[0])
    } else {
      interests = JSON.parse(responseText)
    }

    // Normalize and deduplicate
    const normalized: string[] = []
    const seen = new Set<string>()

    for (const interest of interests) {
      const norm = normalizeInterest(interest)
      if (!seen.has(norm)) {
        normalized.push(norm)
        seen.add(norm)
      }
    }

    return normalized.slice(0, maxInterests)
  } catch (error) {
    console.error('Error extracting interests:', error)
    return []
  }
}

/**
 * Find semantic matches between two interest lists using AI analysis.
 *
 * @param list1 - First user's list of interests
 * @param list2 - Second user's list of interests
 * @returns Dictionary mapping matched concepts to explanations
 *
 * @example
 * const matches = await matchInterestsAI(
 *   ["snowboarding", "fashion", "coding"],
 *   ["makeup", "niche music", "aesthetic photos"]
 * )
 * // Returns: { "visual aesthetics": "You both have an eye for aesthetics..." }
 */
export async function matchInterestsAI(
  list1: string[],
  list2: string[]
): Promise<Record<string, string>> {
  if (!list1?.length || !list2?.length) {
    return {}
  }

  const prompt = `Analyze these two users' interests and find meaningful connections.

USER 1 INTERESTS:
${JSON.stringify(list1, null, 2)}

USER 2 INTERESTS:
${JSON.stringify(list2, null, 2)}

INSTRUCTIONS:
1. Find direct matches (same or very similar interests)
2. Find semantic connections (related concepts that suggest compatibility)
3. Find complementary interests (different but would make for good conversation)
4. Be creative but grounded - only include genuine connections
5. Write explanations as if talking TO these users ("You both...")
6. Keep explanations concise but warm and engaging

Return a JSON object where:
- Keys are the shared concept/theme names
- Values are friendly explanations of why they match

If there are no meaningful connections, return an empty object {}.

Example output:
{
    "visual storytelling": "You both love capturing moments - one through photography, the other through aesthetic curation.",
    "creative expression": "You both express yourselves through creative outlets, whether it's fashion or music."
}

Return ONLY the JSON object, no other text.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Extract JSON object from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    let matches: Record<string, string>

    if (jsonMatch) {
      matches = JSON.parse(jsonMatch[0])
    } else {
      matches = JSON.parse(responseText)
    }

    return matches
  } catch (error) {
    console.error('Error matching interests:', error)
    return {}
  }
}

/**
 * Generate a natural conversation starter based on shared interests.
 */
export async function generateConversationStarter(
  sharedInterests: Record<string, string>
): Promise<string> {
  if (!sharedInterests || Object.keys(sharedInterests).length === 0) {
    return "Hey! Looks like we might have some things in common. What are you into lately?"
  }

  const topMatch = Object.keys(sharedInterests)[0]
  const explanation = sharedInterests[topMatch]

  const prompt = `Generate a casual, friendly conversation starter for two people who matched on a social app.

Their shared interest: ${topMatch}
Why they matched: ${explanation}

Requirements:
- Sound natural, like a real college student texting
- Reference the specific shared interest
- Be warm but not overly enthusiastic
- Keep it to 1-2 sentences
- Don't be generic like "Hey, what's up?"

Return ONLY the conversation starter text, nothing else.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    return text.replace(/^["']|["']$/g, '') // Remove surrounding quotes
  } catch (error) {
    console.error('Error generating conversation starter:', error)
    return `Hey! I noticed we both seem to be into ${topMatch}. What got you into it?`
  }
}

/**
 * Calculate a compatibility score (0-1) based on matched interests.
 */
export function calculateMatchScore(matches: Record<string, string>): number {
  if (!matches || Object.keys(matches).length === 0) {
    return 0
  }

  const numMatches = Object.keys(matches).length

  // Score formula: starts at 0.3 for 1 match, caps at ~0.95 for 5+ matches
  const score = Math.min(0.95, 0.3 + (numMatches - 1) * 0.15)

  return Math.round(score * 100) / 100
}
