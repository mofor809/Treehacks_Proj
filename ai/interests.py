"""
Wavelength AI Interest Extraction & Matching Module

This module provides AI-powered semantic interest extraction and matching
using Claude (Anthropic) for deep understanding of user content.

Functions:
    extract(posts: list) -> list: Extract canonical interests from user posts
    match(list1: list, list2: list) -> dict: Find semantic matches between interest lists
    generate_match_matrix(users: list) -> dict: Generate all pairwise matches
"""

import os
import json
import re
from typing import Optional
from anthropic import Anthropic

# Initialize Anthropic client
# Reads ANTHROPIC_API_KEY from environment
client = Anthropic()

# =============================================================================
# INTEREST NORMALIZATION
# =============================================================================
# Maps common variations/synonyms to canonical interest terms
# This ensures consistent matching across different phrasings

INTEREST_NORMALIZATION_MAP = {
    # Beauty & Style
    "makeup": "beauty & self-expression",
    "cosmetics": "beauty & self-expression",
    "skincare": "beauty & self-expression",
    "fashion": "fashion & style",
    "clothing": "fashion & style",
    "streetwear": "fashion & style",
    "outfits": "fashion & style",

    # Photography & Visual Arts
    "photography": "photography",
    "photos": "photography",
    "golden hour": "photography",
    "portraits": "portrait photography",
    "street photography": "street photography",
    "aesthetic photos": "visual aesthetics",
    "aesthetics": "visual aesthetics",

    # Music
    "indie music": "indie & alternative music",
    "alternative music": "indie & alternative music",
    "niche music": "indie & alternative music",
    "underground music": "indie & alternative music",

    # Tech & Coding
    "coding": "software development",
    "programming": "software development",
    "software": "software development",
    "tech": "technology",
    "ai": "artificial intelligence",
    "machine learning": "artificial intelligence",

    # Sports & Fitness
    "running": "running & cardio",
    "jogging": "running & cardio",
    "snowboarding": "winter sports",
    "skiing": "winter sports",
    "fitness": "health & fitness",
    "gym": "health & fitness",
    "workout": "health & fitness",
}


def normalize_interest(interest: str) -> str:
    """
    Normalize an interest term to its canonical form.

    This prevents duplicate matches like "makeup" and "beauty" being treated
    as separate interests when they represent the same underlying concept.

    Args:
        interest: Raw interest string

    Returns:
        Normalized canonical interest string
    """
    lower = interest.lower().strip()
    return INTEREST_NORMALIZATION_MAP.get(lower, lower)


def extract(posts: list, max_interests: int = 10) -> list:
    """
    Extract semantic interests from a list of user posts using AI analysis.

    This function deeply analyzes post content (text and/or image descriptions)
    to infer specific, canonical interests. It considers:
    - Explicit mentions of hobbies/interests
    - Implicit themes and patterns
    - Writing style and tone
    - Visual content descriptions

    Args:
        posts: List of post content strings (text or image descriptions)
        max_interests: Maximum number of interests to return (default: 10)

    Returns:
        List of normalized, canonical interest strings

    Example:
        >>> extract(["Just posted a golden hour shot of the city",
        ...          "I love indie music and street fashion"])
        ["street photography", "urban aesthetics", "indie & alternative music", "fashion & style"]
    """
    if not posts or all(not p for p in posts):
        return []

    # Combine posts for analysis
    combined_content = "\n---\n".join([p for p in posts if p])

    prompt = f"""Analyze the following user posts and extract their interests, hobbies, and passions.

USER POSTS:
{combined_content}

INSTRUCTIONS:
1. Identify specific interests based on explicit mentions AND implicit themes
2. Be specific rather than generic (e.g., "street photography" not just "photography")
3. Consider the overall vibe and personality shown
4. Look for patterns across multiple posts
5. Include both active hobbies and passive interests
6. Normalize similar concepts (e.g., "makeup" and "beauty" -> "beauty & self-expression")

Return a JSON array of {max_interests} or fewer interest strings.
Be specific and descriptive. Focus on interests that could connect this person with others.

Example output format:
["street photography", "indie music", "urban fashion", "coffee culture", "night owl lifestyle"]

Return ONLY the JSON array, no other text."""

    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Parse the response
        response_text = response.content[0].text.strip()

        # Extract JSON array from response (handle potential markdown formatting)
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            interests = json.loads(json_match.group())
        else:
            interests = json.loads(response_text)

        # Normalize and deduplicate
        normalized = []
        seen = set()
        for interest in interests:
            norm = normalize_interest(interest)
            if norm not in seen:
                normalized.append(norm)
                seen.add(norm)

        return normalized[:max_interests]

    except Exception as e:
        print(f"Error extracting interests: {e}")
        return []


def match(list1: list, list2: list) -> dict:
    """
    Find semantic matches between two interest lists using AI analysis.

    This function goes beyond simple string matching to find conceptual
    overlaps between interests. It identifies:
    - Direct matches (same interest)
    - Semantic overlaps (related concepts)
    - Complementary interests (things that go well together)

    Args:
        list1: First user's list of interests
        list2: Second user's list of interests

    Returns:
        Dictionary mapping matched concepts to explanations
        Empty dict if no meaningful matches found

    Example:
        >>> match(
        ...     ["snowboarding", "fashion", "coding", "running", "photography"],
        ...     ["makeup", "niche music", "cooking", "aesthetic photos"]
        ... )
        {
            "visual aesthetics": "You both have an eye for aesthetics - from fashion choices to capturing beautiful moments.",
            "creative expression": "You both express yourselves creatively, whether through style or photography."
        }
    """
    if not list1 or not list2:
        return {}

    prompt = f"""Analyze these two users' interests and find meaningful connections.

USER 1 INTERESTS:
{json.dumps(list1, indent=2)}

USER 2 INTERESTS:
{json.dumps(list2, indent=2)}

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

If there are no meaningful connections, return an empty object {{}}.

Example output:
{{
    "visual storytelling": "You both love capturing moments - one through photography, the other through aesthetic curation.",
    "creative expression": "You both express yourselves through creative outlets, whether it's fashion or music."
}}

Return ONLY the JSON object, no other text."""

    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=800,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        response_text = response.content[0].text.strip()

        # Extract JSON object from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            matches = json.loads(json_match.group())
        else:
            matches = json.loads(response_text)

        return matches

    except Exception as e:
        print(f"Error matching interests: {e}")
        return {}


def generate_conversation_starter(shared_interests: dict) -> str:
    """
    Generate a natural conversation starter based on shared interests.

    Args:
        shared_interests: Dictionary from match() function

    Returns:
        A friendly, specific conversation starter string
    """
    if not shared_interests:
        return "Hey! Looks like we might have some things in common. What are you into lately?"

    # Get the top matched interest
    top_match = list(shared_interests.keys())[0]

    prompt = f"""Generate a casual, friendly conversation starter for two people who matched on a social app.

Their shared interest: {top_match}
Why they matched: {shared_interests[top_match]}

Requirements:
- Sound natural, like a real college student texting
- Reference the specific shared interest
- Be warm but not overly enthusiastic
- Keep it to 1-2 sentences
- Don't be generic like "Hey, what's up?"

Return ONLY the conversation starter text, nothing else."""

    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=100,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        return response.content[0].text.strip().strip('"')

    except Exception as e:
        print(f"Error generating conversation starter: {e}")
        return f"Hey! I noticed we both seem to be into {top_match}. What got you into it?"


def calculate_match_score(matches: dict) -> float:
    """
    Calculate a compatibility score (0-1) based on matched interests.

    Args:
        matches: Dictionary from match() function

    Returns:
        Float between 0 and 1 representing compatibility
    """
    if not matches:
        return 0.0

    # More matches = higher score, with diminishing returns
    num_matches = len(matches)

    # Score formula: starts at 0.3 for 1 match, caps at ~0.95 for 5+ matches
    score = min(0.95, 0.3 + (num_matches - 1) * 0.15)

    return round(score, 2)


def generate_match_matrix(users: list) -> dict:
    """
    Generate a complete match matrix for all users.

    This function computes pairwise matches between all users,
    suitable for storing in a database for quick lookup.

    Args:
        users: List of dicts with 'id' and 'interests' keys
               Example: [{"id": "user1", "interests": ["coding", "music"]}, ...]

    Returns:
        Dictionary with structure:
        {
            "matches": [
                {
                    "user1_id": "...",
                    "user2_id": "...",
                    "shared_interests": {...},
                    "score": 0.75,
                    "conversation_starter": "..."
                },
                ...
            ],
            "stats": {
                "total_users": N,
                "total_pairs": N,
                "matches_found": N
            }
        }
    """
    matches = []
    total_pairs = 0
    matches_found = 0

    # Generate all unique pairs
    for i in range(len(users)):
        for j in range(i + 1, len(users)):
            total_pairs += 1

            user1 = users[i]
            user2 = users[j]

            # Skip if either user has no interests
            if not user1.get("interests") or not user2.get("interests"):
                continue

            # Find matches
            shared = match(user1["interests"], user2["interests"])

            if shared:
                matches_found += 1
                score = calculate_match_score(shared)
                starter = generate_conversation_starter(shared)

                matches.append({
                    "user1_id": user1["id"],
                    "user2_id": user2["id"],
                    "shared_interests": shared,
                    "score": score,
                    "conversation_starter": starter
                })

                print(f"Match found: {user1['id']} <-> {user2['id']} (score: {score})")

    return {
        "matches": matches,
        "stats": {
            "total_users": len(users),
            "total_pairs": total_pairs,
            "matches_found": matches_found
        }
    }


# =============================================================================
# CLI for testing
# =============================================================================
if __name__ == "__main__":
    import sys

    print("=" * 60)
    print("Wavelength AI Interest Engine - Test Mode")
    print("=" * 60)

    # Test extract
    test_posts = [
        "Just posted a golden hour shot of the city skyline",
        "Been getting into vinyl collecting lately, mostly indie and shoegaze",
        "Late night coding sessions with lo-fi beats hits different"
    ]

    print("\n[TEST] Extracting interests from posts:")
    for post in test_posts:
        print(f"  - {post}")

    interests = extract(test_posts)
    print(f"\nExtracted interests: {interests}")

    # Test match
    print("\n" + "=" * 60)
    print("[TEST] Matching two users:")

    user1_interests = ["street photography", "indie music", "coding", "coffee culture"]
    user2_interests = ["fashion photography", "vinyl collecting", "night owl", "aesthetic cafes"]

    print(f"User 1: {user1_interests}")
    print(f"User 2: {user2_interests}")

    matches = match(user1_interests, user2_interests)
    print(f"\nMatches found: {json.dumps(matches, indent=2)}")

    score = calculate_match_score(matches)
    print(f"\nMatch score: {score}")

    starter = generate_conversation_starter(matches)
    print(f"Conversation starter: {starter}")
