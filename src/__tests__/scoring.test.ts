import { scoreGroupMatch } from '@/lib/scoring/group'
import { scoreAdvancement } from '@/lib/scoring/advancement'
import { scoreKnockoutMatch } from '@/lib/scoring/knockout'

describe('scoreGroupMatch', () => {
  it('returns 3 for exact score', () => {
    expect(scoreGroupMatch({ predHome: 2, predAway: 1 }, { actualHome: 2, actualAway: 1 })).toBe(3)
  })

  it('returns 3 for exact draw', () => {
    expect(scoreGroupMatch({ predHome: 2, predAway: 2 }, { actualHome: 2, actualAway: 2 })).toBe(3)
  })

  it('returns 2 for correct GD (non-draw)', () => {
    expect(scoreGroupMatch({ predHome: 2, predAway: 0 }, { actualHome: 3, actualAway: 1 })).toBe(2)
  })

  it('returns 2 for correctly predicted draw (GD=0 on both sides)', () => {
    // Predicted 1-1, actual 2-2 — both have GD=0 → 2pts
    expect(scoreGroupMatch({ predHome: 1, predAway: 1 }, { actualHome: 2, actualAway: 2 })).toBe(2)
  })

  it('returns 1 for correct outcome only', () => {
    expect(scoreGroupMatch({ predHome: 1, predAway: 0 }, { actualHome: 3, actualAway: 1 })).toBe(1)
  })

  it('returns 0 for wrong outcome', () => {
    expect(scoreGroupMatch({ predHome: 1, predAway: 0 }, { actualHome: 0, actualAway: 1 })).toBe(0)
  })

  it('returns 0 for predicted draw but actual win', () => {
    expect(scoreGroupMatch({ predHome: 1, predAway: 1 }, { actualHome: 2, actualAway: 1 })).toBe(0)
  })
})

describe('scoreAdvancement', () => {
  it('returns 1 for team reaching r32 when predicted r32', () => {
    expect(scoreAdvancement('r32', 'r32')).toBe(1)
  })

  it('returns 1+2=3 for team reaching r16 when predicted r16', () => {
    expect(scoreAdvancement('r16', 'r16')).toBe(3)
  })

  it('returns cumulative 1+2+4=7 when predicted winner but team only reaches QF', () => {
    expect(scoreAdvancement('final', 'qf')).toBe(7)
  })

  it('returns cumulative pts up to actual stage when overpredicted', () => {
    // predicted sf, actual r16 → only r32(1) + r16(2) = 3
    expect(scoreAdvancement('sf', 'r16')).toBe(3)
  })

  it('returns cumulative pts up to actual stage when underpredicted', () => {
    // predicted r32, actual sf → only r32(1) = 1
    expect(scoreAdvancement('r32', 'sf')).toBe(1)
  })

  it('returns 0 for invalid stage', () => {
    expect(scoreAdvancement('unknown', 'r32')).toBe(0)
  })
})

describe('scoreKnockoutMatch', () => {
  const TEAM_A = 'team-a-id'
  const TEAM_B = 'team-b-id'

  it('returns 3 for exact score', () => {
    expect(
      scoreKnockoutMatch(
        { predHomeScore: 2, predAwayScore: 1, predWinnerId: TEAM_A },
        { actualHomeScore: 2, actualAwayScore: 1, actualWinnerId: TEAM_A, decidedBy: 'ft' },
      )
    ).toBe(3)
  })

  it('returns 2 for correct GD + outcome', () => {
    expect(
      scoreKnockoutMatch(
        { predHomeScore: 2, predAwayScore: 0, predWinnerId: TEAM_A },
        { actualHomeScore: 3, actualAwayScore: 1, actualWinnerId: TEAM_A, decidedBy: 'ft' },
      )
    ).toBe(2)
  })

  it('returns 1 for correct winner only', () => {
    expect(
      scoreKnockoutMatch(
        { predHomeScore: 2, predAwayScore: 0, predWinnerId: TEAM_A },
        { actualHomeScore: 1, actualAwayScore: 0, actualWinnerId: TEAM_A, decidedBy: 'ft' },
      )
    ).toBe(1)
  })

  it('returns 0 for wrong winner', () => {
    expect(
      scoreKnockoutMatch(
        { predHomeScore: 2, predAwayScore: 1, predWinnerId: TEAM_A },
        { actualHomeScore: 1, actualAwayScore: 2, actualWinnerId: TEAM_B, decidedBy: 'ft' },
      )
    ).toBe(0)
  })

  it('returns 3 for correct winner in a pens match (penalty special)', () => {
    expect(
      scoreKnockoutMatch(
        { predHomeScore: 3, predAwayScore: 0, predWinnerId: TEAM_A }, // score completely wrong
        { actualHomeScore: 1, actualAwayScore: 1, actualWinnerId: TEAM_A, decidedBy: 'pens' },
      )
    ).toBe(3)
  })

  it('returns 0 for wrong winner in a pens match', () => {
    expect(
      scoreKnockoutMatch(
        { predHomeScore: 2, predAwayScore: 1, predWinnerId: TEAM_A },
        { actualHomeScore: 1, actualAwayScore: 1, actualWinnerId: TEAM_B, decidedBy: 'pens' },
      )
    ).toBe(0)
  })
})
