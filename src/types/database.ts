export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          school_year: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          school_year?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          school_year?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          type: 'dm' | 'group'
          post_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: 'dm' | 'group'
          post_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'dm' | 'group'
          post_id?: string | null
          created_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          post_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          post_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          post_id?: string | null
          created_at?: string
        }
      }
      widgets: {
        Row: {
          id: string
          user_id: string
          type: 'text' | 'image' | 'repost'
          content: string | null
          image_url: string | null
          original_widget_id: string | null
          interest_tags: string[] | null
          created_at: string
          position: number
        }
        Insert: {
          id?: string
          user_id: string
          type: 'text' | 'image' | 'repost'
          content?: string | null
          image_url?: string | null
          original_widget_id?: string | null
          interest_tags?: string[] | null
          created_at?: string
          position?: number
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'text' | 'image' | 'repost'
          content?: string | null
          image_url?: string | null
          original_widget_id?: string | null
          interest_tags?: string[] | null
          created_at?: string
          position?: number
        }
      }
      prompts: {
        Row: {
          id: string
          question: string
          type: 'daily' | 'weekly' | 'random'
          active_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          question: string
          type: 'daily' | 'weekly' | 'random'
          active_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          question?: string
          type?: 'daily' | 'weekly' | 'random'
          active_date?: string | null
          created_at?: string
        }
      }
      prompt_responses: {
        Row: {
          id: string
          prompt_id: string
          user_id: string
          content: string | null
          image_url: string | null
          interest_tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          prompt_id: string
          user_id: string
          content?: string | null
          image_url?: string | null
          interest_tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          prompt_id?: string
          user_id?: string
          content?: string | null
          image_url?: string | null
          interest_tags?: string[] | null
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          shared_tags: string[] | null
          conversation_starter: string | null
          notified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          shared_tags?: string[] | null
          conversation_starter?: string | null
          notified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          shared_tags?: string[] | null
          conversation_starter?: string | null
          notified?: boolean
          created_at?: string
        }
      }
      user_matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          shared_interests: Record<string, string>
          match_score: number
          conversation_starter: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          shared_interests: Record<string, string>
          match_score: number
          conversation_starter?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          shared_interests?: Record<string, string>
          match_score?: number
          conversation_starter?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Widget = Database['public']['Tables']['widgets']['Row']
export type Prompt = Database['public']['Tables']['prompts']['Row']
export type PromptResponse = Database['public']['Tables']['prompt_responses']['Row']
export type Match = Database['public']['Tables']['matches']['Row']

// Widget with user profile for feed
export type WidgetWithProfile = Widget & {
  profiles: Profile
}

// Widget with original widget for reposts
export type WidgetWithOriginal = Widget & {
  original_widget?: Widget & {
    profiles: Profile
  }
  profiles: Profile
}

// Prompt response with profile
export type PromptResponseWithProfile = PromptResponse & {
  profiles: Profile
}

// Match with both user profiles
export type MatchWithProfiles = Match & {
  user1: Profile
  user2: Profile
}

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type UserMatch = Database['public']['Tables']['user_matches']['Row']

// User match with profiles for display
export type UserMatchWithProfiles = UserMatch & {
  user1: Profile
  user2: Profile
}
