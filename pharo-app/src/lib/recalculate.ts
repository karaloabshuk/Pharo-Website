import { prisma } from './prisma';

export async function recalculateGameweek(gameweekId: string) {
  // Get all events for this gameweek
  const events = await prisma.matchEvent.findMany({
    where: { match: { gameweekId } },
    include: { player: true },
  });

  // Aggregate player points per gameweek
  const playerPointsMap: Record<string, { points: number }> = {};
  for (const event of events) {
    const pid = event.playerId;
    if (!playerPointsMap[pid]) playerPointsMap[pid] = { points: 0 };
    playerPointsMap[pid].points += event.points;
  }

  // Upsert PlayerGameweekPoint for each player who has events
  const upserts = Object.entries(playerPointsMap).map(([playerId, data]) =>
    prisma.playerGameweekPoint.upsert({
      where: {
        playerId_gameweekId: { playerId, gameweekId },
      },
      update: { points: data.points },
      create: { playerId, gameweekId, points: data.points },
    })
  );

  // Zero out / remove points for players who had events but now have 0
  const playerIds = Object.keys(playerPointsMap);
  await prisma.playerGameweekPoint.updateMany({
    where: {
      gameweekId,
      playerId: { notIn: playerIds },
    },
    data: { points: 0 },
  });

  await Promise.all(upserts);

  // Recalculate manager points for this gameweek
  await recalculateManagerPoints(gameweekId);
}

export async function recalculatePlayerAndManagerPoints(gameweekId: string) {
  await recalculateGameweek(gameweekId);
}

export async function recalculateManagerPoints(gameweekId: string) {
  const fantasyTeams = await prisma.fantasyTeam.findMany({
    include: {
      players: true,
    },
  });

  for (const team of fantasyTeams) {
    let totalPoints = 0;

    for (const ftp of team.players) {
      if (ftp.isBench) continue;

      const ppgp = await prisma.playerGameweekPoint.findUnique({
        where: {
          playerId_gameweekId: {
            playerId: ftp.playerId,
            gameweekId,
          },
        },
      });

      let points = ppgp?.points || 0;
      if (ftp.isCaptain) points *= 2;

      totalPoints += points;
    }

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