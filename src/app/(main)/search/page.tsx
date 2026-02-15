'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search as SearchIcon, Users, Hash, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { getAllInterestKeywords } from '@/lib/interests'
import { Profile, Widget } from '@/types/database'

type SearchMode = 'people' | 'interests'

interface SearchResult {
  type: 'user' | 'widget'
  user?: Profile
  widget?: Widget & { profiles?: Profile }
}

export default function SearchPage() {
  const [mode, setMode] = useState<SearchMode>('people')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Get interest suggestions
  useEffect(() => {
    const allInterests = getAllInterestKeywords()
    setSuggestions(allInterests.slice(0, 12))
  }, [])

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery ?? query
    if (!q.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      if (mode === 'people') {
        // Search users by username or display name
        const { data: users } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
          .limit(20)

        setResults(
          (users ?? []).map(user => ({
            type: 'user' as const,
            user,
          }))
        )
      } else {
        // Search widgets by interest tags - use text search for partial matching
        // First try exact array match, then fall back to text search
        const searchTerm = q.toLowerCase()

        // Get all widgets with interest_tags and filter client-side for flexibility
        const { data: widgets } = await supabase
          .from('widgets')
          .select(`
            *,
            profiles!widgets_user_id_fkey (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .not('interest_tags', 'is', null)
          .limit(100)

        // Filter widgets where any interest tag contains the search term
        const filteredWidgets = (widgets ?? []).filter((widget: any) => {
          if (!widget.interest_tags || widget.interest_tags.length === 0) return false
          return widget.interest_tags.some((tag: string) =>
            tag.toLowerCase().includes(searchTerm)
          )
        })

        // Also search in content for the interest term
        const { data: contentWidgets } = await supabase
          .from('widgets')
          .select(`
            *,
            profiles!widgets_user_id_fkey (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .ilike('content', `%${searchTerm}%`)
          .limit(30)

        // Combine and deduplicate results
        const allWidgets = [...filteredWidgets, ...(contentWidgets ?? [])]
        const uniqueWidgets = allWidgets.filter((widget, index, self) =>
          index === self.findIndex((w) => w.id === widget.id)
        ).slice(0, 30)

        setResults(
          uniqueWidgets.map(widget => ({
            type: 'widget' as const,
            widget,
          }))
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setMode('interests')
    handleSearch(suggestion)
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg z-10 safe-area-inset-top">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-center mb-3">Search</h1>

          {/* Search input */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={mode === 'people' ? 'Search people...' : 'Search interests...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-11 bg-card"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 mt-3">
            <Button
              variant={mode === 'people' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('people')}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              People
            </Button>
            <Button
              variant={mode === 'interests' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('interests')}
              className="flex-1"
            >
              <Hash className="w-4 h-4 mr-2" />
              Interests
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Suggestions (when no query) */}
        {!query && mode === 'interests' && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">Popular interests</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-sm bg-secondary rounded-full hover:bg-secondary/80 transition-colors active-scale"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {results.map((result, index) => (
                <motion.div
                  key={result.type === 'user' ? result.user?.id : result.widget?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {result.type === 'user' && result.user && (
                    <Link href={`/profile/${encodeURIComponent(result.user.username ?? '')}`}>
                      <Card className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={result.user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {result.user.username?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {result.user.display_name || result.user.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @{result.user.username}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )}

                  {result.type === 'widget' && result.widget && (
                    (() => {
                      const WrappedCard = (
                        <Card className={`p-4 ${result.widget.profiles?.username ? 'hover:bg-muted/50 transition-colors' : ''}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={result.widget.profiles?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {result.widget.profiles?.username?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              @{result.widget.profiles?.username}
                            </span>
                          </div>
                          {result.widget.type === 'image' && result.widget.image_url && (
                            <img
                              src={result.widget.image_url}
                              alt=""
                              className="w-full rounded-lg mb-2 object-cover max-h-40"
                            />
                          )}
                          {result.widget.content && (
                            <p className="text-sm">{result.widget.content}</p>
                          )}
                          {result.widget.interest_tags && result.widget.interest_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.widget.interest_tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    tag.toLowerCase() === query.toLowerCase()
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-primary/10 text-primary'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </Card>
                      )
                      return result.widget.profiles?.username ? (
                        <Link key={result.widget.id} href={`/profile/${encodeURIComponent(result.widget.profiles.username)}`}>
                          {WrappedCard}
                        </Link>
                      ) : (
                        WrappedCard
                      )
                    })()
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : query && !isLoading ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground">
                No results found for &quot;{query}&quot;
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
