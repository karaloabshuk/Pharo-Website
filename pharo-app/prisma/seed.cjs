const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ---- TEAMS (Grade classes) ----
  const teamNames = [
    'Grade 10A',
    'Grade 10B',
    'Grade 10C',
    'Grade 9A',
    'Grade 9B',
    'Grade 11A',
    'Grade 11B',
    'Grade 12A',
  ];

  const teams = [];
  for (const name of teamNames) {
    const team = await prisma.team.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    teams.push(team);
  }

  // ---- PLAYERS (from original fantacy.js playerDB) ----
  const playerData = [
    // GK
    { name: 'Robel', price: 3.5, position: 'GK', teamIndex: 0 },
    { name: 'Samuel', price: 2.5, position: 'GK', teamIndex: 1 },
    { name: 'Daniel', price: 3.0, position: 'GK', teamIndex: 2 },
    // LB
    { name: 'Adoni', price: 3.0, position: 'DEF', teamIndex: 0 },
    { name: 'Yonas', price: 2.0, position: 'DEF', teamIndex: 1 },
    { name: 'Ephrem', price: 2.5, position: 'DEF', teamIndex: 2 },
    // CB1
    { name: 'Halid', price: 3.5, position: 'DEF', teamIndex: 0 },
    { name: 'Tomas', price: 2.5, position: 'DEF', teamIndex: 1 },
    { name: 'Isaac', price: 3.0, position: 'DEF', teamIndex: 2 },
    // CB2
    { name: 'Muaz', price: 3.0, position: 'DEF', teamIndex: 3 },
    { name: 'Natan', price: 2.5, position: 'DEF', teamIndex: 4 },
    { name: 'Joel', price: 2.0, position: 'DEF', teamIndex: 5 },
    // RB
    { name: 'Canto', price: 3.0, position: 'DEF', teamIndex: 3 },
    { name: 'Riki', price: 2.0, position: 'DEF', teamIndex: 4 },
    { name: 'Dawit', price: 2.5, position: 'DEF', teamIndex: 5 },
    // CM1
    { name: 'Karalo', price: 4.5, position: 'MID', teamIndex: 0 },
    { name: 'Mikiyas', price: 3.5, position: 'MID', teamIndex: 1 },
    { name: 'Abel', price: 2.5, position: 'MID', teamIndex: 2 },
    // CM2
    { name: 'Nahom', price: 4.0, position: 'MID', teamIndex: 3 },
    { name: 'Bereket', price: 3.0, position: 'MID', teamIndex: 4 },
    { name: 'Sami', price: 3.5, position: 'MID', teamIndex: 5 },
    // CM3
    { name: 'Hiruy', price: 3.5, position: 'MID', teamIndex: 6 },
    { name: 'Luel', price: 2.5, position: 'MID', teamIndex: 7 },
    { name: 'Fanuel', price: 3.0, position: 'MID', teamIndex: 0 },
    // LW
    { name: 'Kedus', price: 4.5, position: 'FWD', teamIndex: 1 },
    { name: 'Matios', price: 3.5, position: 'FWD', teamIndex: 2 },
    { name: 'Habtamu', price: 2.5, position: 'FWD', teamIndex: 3 },
    // ST
    { name: 'Abel', price: 4.0, position: 'FWD', teamIndex: 4 },
    { name: 'Biniam', price: 3.5, position: 'FWD', teamIndex: 5 },
    { name: 'Surafel', price: 3.0, position: 'FWD', teamIndex: 6 },
    // RW
    { name: 'Bombe', price: 4.0, position: 'FWD', teamIndex: 7 },
    { name: 'Kidus', price: 2.0, position: 'FWD', teamIndex: 6 },
    { name: 'Yohannes', price: 2.5, position: 'FWD', teamIndex: 5 },
  ];

  let playerCount = 0;
  const nameCounts = {};
  for (const p of playerData) {
    const key = p.name;
    nameCounts[key] = (nameCounts[key] || 0) + 1;
    const uniqueName = nameCounts[key] > 1 ? `${p.name} ${nameCounts[key]}` : p.name;
    await prisma.player.upsert({
      where: { id: `${p.position.toLowerCase()}-${uniqueName.toLowerCase().replace(/\s+/g, '-')}` },
      update: {
        position: p.position,
        price: p.price,
        teamId: teams[p.teamIndex].id,
      },
      create: {
        id: `${p.position.toLowerCase()}-${uniqueName.toLowerCase().replace(/\s+/g, '-')}`,
        name: uniqueName,
        position: p.position,
        price: p.price,
        teamId: teams[p.teamIndex].id,
      },
    });
    playerCount++;
  }

  // ---- ADMIN USER ----
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';
  const adminHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: 'admin@pharofantasy.com' },
    update: {},
    create: {
      name: 'Pharo Admin',
      email: 'admin@pharofantasy.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  // ---- GAMEWEEKS ----
  for (let i = 1; i <= 8; i++) {
    await prisma.gameweek.upsert({
      where: { number: i },
      update: {},
      create: {
        number: i,
        name: `Gameweek ${i}`,
        status: 'PENDING',
      },
    });
  }

  console.log(`✅ Seeded ${playerCount} players, ${teams.length} teams, 1 admin user, 8 gameweeks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });