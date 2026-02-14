/**
 * Mock interest extraction - keyword based
 * Easy to swap in OpenAI later
 */

const INTEREST_KEYWORDS = [
  // Hobbies & Activities
  'photography', 'music', 'coding', 'art', 'coffee', 'gaming',
  'reading', 'fitness', 'travel', 'cooking', 'film', 'design',
  'writing', 'nature', 'tech', 'fashion', 'sports', 'dance',
  'yoga', 'meditation', 'hiking', 'cycling', 'running', 'swimming',

  // Academic & Professional
  'science', 'math', 'engineering', 'business', 'psychology',
  'philosophy', 'history', 'literature', 'economics', 'politics',
  'medicine', 'law', 'biology', 'chemistry', 'physics', 'astronomy',

  // Entertainment
  'movies', 'anime', 'manga', 'podcasts', 'netflix', 'concerts',
  'theater', 'comedy', 'horror', 'drama', 'documentary', 'indie',

  // Music genres
  'jazz', 'rock', 'pop', 'hip-hop', 'classical', 'electronic',
  'r&b', 'country', 'folk', 'metal', 'punk', 'alternative',

  // Food & Drink
  'baking', 'vegan', 'vegetarian', 'foodie', 'wine', 'beer',
  'tea', 'sushi', 'pizza', 'tacos', 'brunch', 'desserts',

  // Sports
  'basketball', 'soccer', 'football', 'baseball', 'tennis',
  'volleyball', 'hockey', 'golf', 'skiing', 'snowboarding',

  // Creative
  'painting', 'drawing', 'sculpture', 'crafts', 'diy', 'pottery',
  'knitting', 'sewing', 'woodworking', 'photography', 'filmmaking',

  // Tech & Gaming
  'programming', 'startups', 'ai', 'crypto', 'web3', 'mobile',
  'esports', 'nintendo', 'playstation', 'xbox', 'pc gaming',

  // Lifestyle
  'sustainability', 'minimalism', 'wellness', 'self-improvement',
  'productivity', 'spirituality', 'astrology', 'plants', 'pets',
  'dogs', 'cats', 'vintage', 'thrifting', 'sneakers',
] as const

export function extractInterests(content: string): string[] {
  if (!content) return []

  const lowerContent = content.toLowerCase()

  // Find matching keywords
  const found = INTEREST_KEYWORDS.filter(keyword => {
    // Check for whole word matches (with word boundaries)
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    return regex.test(lowerContent)
  })

  // Return found keywords (max 5)
  if (found.length > 0) {
    return found.slice(0, 5)
  }

  // If no keywords found, return empty array
  // (In production, this would call OpenAI for semantic extraction)
  return []
}

/**
 * Get all available interest keywords
 * Useful for search autocomplete
 */
export function getAllInterestKeywords(): string[] {
  return [...INTEREST_KEYWORDS]
}

/**
 * Find shared interests between two sets of tags
 */
export function findSharedInterests(tags1: string[], tags2: string[]): string[] {
  const set1 = new Set(tags1.map(t => t.toLowerCase()))
  return tags2.filter(tag => set1.has(tag.toLowerCase()))
}

/**
 * Calculate interest match score (0-1)
 */
export function calculateMatchScore(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 || tags2.length === 0) return 0

  const shared = findSharedInterests(tags1, tags2)
  const totalUnique = new Set([...tags1, ...tags2]).size

  return shared.length / totalUnique
}
