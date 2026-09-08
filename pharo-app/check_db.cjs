const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const [pl, te, us, gw, ma, mt] = await Promise.all([
    p.player.count(),
    p.team.count(),
    p.user.count(),
    p.gameweek.count(),
    p.match.count(),
    p.matchEvent.count(),
  ]);
  console.log('players', pl, 'teams', te, 'users', us, 'gameweeks', gw, 'matches', ma, 'matchEvents', mt);
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
