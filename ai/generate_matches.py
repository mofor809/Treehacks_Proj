#!/usr/bin/env python3
"""
Wavelength Match Matrix Generator

This script fetches all users and their posts from Supabase,
extracts interests using AI, and generates pairwise matches.

Usage:
    python generate_matches.py

Environment variables required:
    ANTHROPIC_API_KEY - Your Anthropic API key
    NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
    SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key (for write access)
"""

import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('../.env.local')

# Check for required environment variables
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
ANTHROPIC_KEY = os.getenv('ANTHROPIC_API_KEY')

if not all([SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_KEY]):
    print("ERROR: Missing required environment variables.")
    print("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY")
    sys.exit(1)

# Import after checking env vars
from supabase import create_client, Client
from interests import extract, match, calculate_match_score, generate_conversation_starter

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_all_users_with_posts() -> list:
    """
    Fetch all users and their posts from Supabase.

    Returns:
        List of dicts with 'id', 'username', and 'posts' keys
    """
    print("\n[1/4] Fetching users and posts from Supabase...")

    # Fetch all profiles
    profiles_response = supabase.table('profiles').select('id, username').execute()
    profiles = profiles_response.data or []

    print(f"  Found {len(profiles)} users")

    users = []
    for profile in profiles:
        # Fetch user's widgets (posts)
        widgets_response = supabase.table('widgets') \
            .select('content, type') \
            .eq('user_id', profile['id']) \
            .neq('type', 'repost') \
            .execute()

        widgets = widgets_response.data or []

        # Extract text content from widgets
        posts = [w['content'] for w in widgets if w.get('content')]

        users.append({
            'id': profile['id'],
            'username': profile.get('username', 'unknown'),
            'posts': posts
        })

        if posts:
            print(f"  - {profile.get('username', 'unknown')}: {len(posts)} posts")

    return users


def extract_all_interests(users: list) -> list:
    """
    Extract interests for all users using AI.

    Args:
        users: List of user dicts with 'posts' key

    Returns:
        Same list with 'interests' key added
    """
    print("\n[2/4] Extracting interests using AI...")

    for i, user in enumerate(users):
        if not user['posts']:
            user['interests'] = []
            print(f"  - {user['username']}: No posts, skipping")
            continue

        interests = extract(user['posts'])
        user['interests'] = interests
        print(f"  - {user['username']}: {interests}")

    return users


def generate_all_matches(users: list) -> list:
    """
    Generate pairwise matches between all users.

    Args:
        users: List of user dicts with 'interests' key

    Returns:
        List of match dicts ready for database insertion
    """
    print("\n[3/4] Generating pairwise matches...")

    matches = []
    total_pairs = 0

    # Filter users with interests
    users_with_interests = [u for u in users if u.get('interests')]
    print(f"  {len(users_with_interests)} users have interests")

    for i in range(len(users_with_interests)):
        for j in range(i + 1, len(users_with_interests)):
            total_pairs += 1

            user1 = users_with_interests[i]
            user2 = users_with_interests[j]

            # Ensure user1_id < user2_id for database constraint
            if user1['id'] > user2['id']:
                user1, user2 = user2, user1

            # Generate match
            shared = match(user1['interests'], user2['interests'])

            if shared:
                score = calculate_match_score(shared)
                starter = generate_conversation_starter(shared)

                matches.append({
                    'user1_id': user1['id'],
                    'user2_id': user2['id'],
                    'shared_interests': shared,
                    'match_score': score,
                    'conversation_starter': starter
                })

                print(f"  Match: {user1['username']} <-> {user2['username']} (score: {score})")

    print(f"\n  Total pairs analyzed: {total_pairs}")
    print(f"  Matches found: {len(matches)}")

    return matches


def save_matches_to_supabase(matches: list) -> None:
    """
    Save matches to the user_matches table in Supabase.
    Uses upsert to update existing matches.

    Args:
        matches: List of match dicts
    """
    print("\n[4/4] Saving matches to Supabase...")

    if not matches:
        print("  No matches to save")
        return

    # Upsert matches (update if exists, insert if not)
    for match_data in matches:
        try:
            supabase.table('user_matches').upsert(
                match_data,
                on_conflict='user1_id,user2_id'
            ).execute()
            print(f"  Saved: {match_data['user1_id'][:8]}... <-> {match_data['user2_id'][:8]}...")
        except Exception as e:
            print(f"  Error saving match: {e}")

    print(f"\n  Successfully saved {len(matches)} matches!")


def main():
    """Main entry point for the match matrix generator."""
    print("=" * 60)
    print("Wavelength Match Matrix Generator")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Step 1: Fetch users and posts
    users = fetch_all_users_with_posts()

    if not users:
        print("\nNo users found. Exiting.")
        return

    # Step 2: Extract interests
    users = extract_all_interests(users)

    # Step 3: Generate matches
    matches = generate_all_matches(users)

    # Step 4: Save to database
    save_matches_to_supabase(matches)

    print("\n" + "=" * 60)
    print("Match matrix generation complete!")
    print("=" * 60)

    # Return summary for potential programmatic use
    return {
        'users_processed': len(users),
        'matches_generated': len(matches),
        'timestamp': datetime.now().isoformat()
    }


if __name__ == "__main__":
    result = main()
    print(f"\nSummary: {json.dumps(result, indent=2)}")
