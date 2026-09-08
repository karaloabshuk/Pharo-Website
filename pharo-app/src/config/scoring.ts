export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
export type EventType =
  | 'GOAL'
  | 'ASSIST'
  | 'CLEAN_SHEET'
  | 'SAVE'
  | 'PENALTY_SAVE'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'OWN_GOAL'
  | 'PENALTY_MISS'
  | 'DEFENSIVE_CONTRIBUTION'
  | 'BONUS';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  GOAL: 'Goal',
  ASSIST: 'Assist',
  CLEAN_SHEET: 'Clean Sheet',
  SAVE: 'Save',
  PENALTY_SAVE: 'Penalty Save',
  YELLOW_CARD: 'Yellow Card',
  RED_CARD: 'Red Card',
  OWN_GOAL: 'Own Goal',
  PENALTY_MISS: 'Penalty Miss',
  DEFENSIVE_CONTRIBUTION: 'Defensive Contribution',
  BONUS: 'Bonus',
};

export const EVENT_TYPES: EventType[] = Object.keys(EVENT_TYPE_LABELS) as EventType[];

export const POSITION_LABELS: Record<Position, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
};

export const POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

interface ScoringRule {
  GK: number;
  DEF: number;
  MID: number;
  FWD: number;
}

export const SCORING_RULES: Record<EventType, ScoringRule> = {
  GOAL:                    { GK: 10, DEF:  6, MID:  5, FWD:  4 },
  ASSIST:                  { GK:  3, DEF:  3, MID:  3, FWD:  3 },
  CLEAN_SHEET:             { GK:  4, DEF:  4, MID:  1, FWD:  0 },
  SAVE:                    { GK:  1, DEF:  0, MID:  0, FWD:  0 }, // per 3 saves
  PENALTY_SAVE:            { GK:  5, DEF:  0, MID:  0, FWD:  0 },
  YELLOW_CARD:             { GK: -1, DEF: -1, MID: -1, FWD: -1 },
  RED_CARD:                { GK: -3, DEF: -3, MID: -3, FWD: -3 },
  OWN_GOAL:                { GK: -2, DEF: -2, MID: -2, FWD: -2 },
  PENALTY_MISS:            { GK: -2, DEF: -2, MID: -2, FWD: -2 },
  DEFENSIVE_CONTRIBUTION:  { GK:  0, DEF:  2, MID:  2, FWD:  2 },
  BONUS:                   { GK:  0, DEF:  0, MID:  0, FWD:  0 }, // admin-controlled
};

export function calculatePoints(
  eventType: EventType,
  position: Position,
  bonusValue?: number | null
): number {
  if (eventType === 'BONUS') {
    return bonusValue ?? 0;
  }
  if (eventType === 'SAVE') {
    return SCORING_RULES.SAVE[position];
  }
  return SCORING_RULES[eventType][position];
}

export const CAPTAIN_MULTIPLIER = 2;