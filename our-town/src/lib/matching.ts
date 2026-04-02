/**
 * Barter match engine.
 *
 * Scoring logic:
 *  +10 per category overlap (A offers cat X, B needs cat X — or vice versa)
 *  +5  per keyword overlap in titles (tokenized word match)
 *
 * Runs entirely in-process — no DB writes. Callers decide whether to persist.
 */

export interface MatchableUser {
  id: string
  name: string
  city: string | null
  state: string | null
  offers: { title: string; categoryId: string | null }[]
  needs: { title: string; categoryId: string | null }[]
}

export interface MatchResult {
  user: MatchableUser
  score: number
  reasons: string[]
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
  )
}

/**
 * Compute match score between two users.
 * Returns null if score is 0 (no meaningful overlap).
 */
export function scoreMatch(a: MatchableUser, b: MatchableUser): MatchResult | null {
  let score = 0
  const reasons: string[] = []

  // A offers → B needs
  for (const offer of a.offers) {
    for (const need of b.needs) {
      // Category match
      if (offer.categoryId && need.categoryId && offer.categoryId === need.categoryId) {
        score += 10
        reasons.push(`${a.name} offers "${offer.title}" which ${b.name} needs`)
        continue // avoid double-counting with keyword match for same pair
      }
      // Keyword match
      const offerTokens = tokenize(offer.title)
      const needTokens = tokenize(need.title)
      const overlap = Array.from(offerTokens).filter(t => needTokens.has(t))
      if (overlap.length > 0) {
        score += 5
        reasons.push(`${a.name} offers "${offer.title}" — keyword match with ${b.name}'s need "${need.title}"`)
      }
    }
  }

  // B offers → A needs
  for (const offer of b.offers) {
    for (const need of a.needs) {
      if (offer.categoryId && need.categoryId && offer.categoryId === need.categoryId) {
        score += 10
        reasons.push(`${b.name} offers "${offer.title}" which ${a.name} needs`)
        continue
      }
      const offerTokens = tokenize(offer.title)
      const needTokens = tokenize(need.title)
      const overlap = Array.from(offerTokens).filter(t => needTokens.has(t))
      if (overlap.length > 0) {
        score += 5
        reasons.push(`${b.name} offers "${offer.title}" — keyword match with ${a.name}'s need "${need.title}"`)
      }
    }
  }

  if (score === 0) return null

  return { user: b, score, reasons }
}

/**
 * Find top matches for a given user from a list of candidates.
 */
export function findTopMatches(
  subject: MatchableUser,
  candidates: MatchableUser[],
  limit = 5
): MatchResult[] {
  return candidates
    .filter(c => c.id !== subject.id)
    .map(c => scoreMatch(subject, c))
    .filter((r): r is MatchResult => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
