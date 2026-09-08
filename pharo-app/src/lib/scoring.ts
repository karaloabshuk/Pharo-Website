import { prisma } from './prisma';
import { calculatePoints, CAPTAIN_MULTIPLIER, type EventType, type Position } from '@/config/scoring';

export async function addMatchEvent(
  matchId: string,
  playerId: string,
  eventType: EventType,
  bonusValue?: number
) {
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error('Player not found');

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error('Match not found');

  const points = calculatePoints(eventType, player.position as Position, bonusValue);

  const event = await prisma.matchEvent.create({
    data: {
      matchId,
      playerId,
      eventType,
      points,
      bonusValue: eventType === 'BONUS' ? bonusValue ?? null : null,
    },
    include: { player: true },
  });

  await recalculatePoints(match.gameweekId, matchId);
  return event;
}

export async function deleteMatchEvent(eventId: string) {
  const event = await prisma.matchEvent.findUnique({
    where: { id: eventId },
    include: { match: true },
  });
  if (!event) throw new Error('Event not found');

  await prisma.matchEvent.delete({ where: { id: eventId } });
  await recalculatePoints(event.match.gameweekId, event.matchId);
  return event;
}

export async function updateMatchEvent(
  eventId: string,
  data: { eventType?: EventType; playerId?: string; bonusValue?: number }
) {
  const existing = await prisma.matchEvent.findUnique({
    where: { id: eventId },
    include: { match: true },
  });
  if (!existing) throw new Error('Event not found');

  const playerId = data.playerId ?? existing.playerId;
  const eventType = data.eventType ?? existing.eventType;
  const bonusValue = data.bonusValue !== undefined ? data.bonusValue : existing.bonusValue;

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error('Player not found');

  const points = calculatePoints(eventType, player.position as Position, bonusValue);

  const updated = await prisma.matchEvent.update({
    where: { id: eventId },
    data: {
      playerId,
      eventType,
      points,
      bonusValue: eventType === 'BONUS' ? bonusValue ?? null : null,
    },
    include: { player: true },
  });

  await recalculatePoints(existing.match.gameweekId, existing.matchId);
  return updated;
}

async function recalculatePoints(gameweekId: string, matchId: string) {
  // Get all events for this gameweek
  const events = await prisma.matchEvent.findMany({
    where: { match: { gameweekId } },
    include: { player: true, match: true },
  });

  // Aggregate player points per gameweek
  const playerPointsMap: Record<string, number> = {};
  for (const event of events) {
    const pid = event.playerId;
    playerPointsMap[pid] = (playerPointsMap[pid] || 0) + event.points;
  }

  // Upsert PlayerGameweekPoint for each player
  const upserts = Object.entries(playerPointsMap).map(([playerId, points]) =>
    prisma.playerGameweekPoint.upsert({
      where: {
        playerId_gameweekId: { playerId, gameweekId },
      },
      update: { points },
      create: { playerId, gameweekId, points },
    })
  );

  // For players who had events but now have 0, delete their records
  const playersWithEvents = Object.keys(playerPointsMap);
  const cleanup = prisma.playerGameweekPoint.deleteMany({
    where: {
      gameweekId,
      points: 0,
      playerId: { notIn: playersWithEvents },
    },
  });

  await Promise.all([...upserts, cleanup]);

  // Now recalculate manager (fantasy team) points for this gameweek
  await recalculateManagerPoints(gameweekId);
}

async function recalculateManagerPoints(gameweekId: string) {
  // Get all fantasy teams
  const fantasyTeams = await prisma.fantasyTeam.findMany({
    include: {
      players: {
        include: {
          player: true,
        },
      },
      captainTeamPlayer: true,
    },
  });

  for (const team of fantasyTeams) {
    let totalPoints = 0;

    for (const ftp of team.players) {
      if (ftp.isBench) continue; // Bench players don't contribute

      // Get this player's points for this gameweek
      const ppgp = await prisma.playerGameweekPoint.findUnique({
        where: {
          playerId_gameweekId: {
            playerId: ftp.playerId,
            gameweekId,
          },
        },
      });

      let playerPoints = ppgp?.points || 0;

      // Apply captain multiplier
      if (ftp.isCaptain) {
        playerPoints = playerPoints * CAPTAIN_MULTIPLIER;
      }

      totalPoints += playerPoints;
    }

    // Upsert manager gameweek points
    await prisma.managerGameweekPoint.upsert({
      where: {
        fantasyTeamId_gameweekId: {
          fantasyTeamId: team.id,
          gameweekId,
        },
      },
      update: { points: totalPoints },
      create: {
        fantasyTeamId: team.id,
        gameweekId,
        points: totalPoints,
      },
    });
  }
}