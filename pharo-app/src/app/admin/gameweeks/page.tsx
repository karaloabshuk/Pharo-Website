import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import GameweeksClient from './GameweeksClient';

export const dynamic = 'force-dynamic';

export default async function AdminGameweeksPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const gameweeks = await prisma.gameweek.findMany({
    orderBy: { number: 'asc' },
    include: {
      matches: {
        include: { homeTeam: true, awayTeam: true },
      },
      playerPoints: { include: { player: true } },
      managerPoints: {
        include: { fantasyTeam: { include: { user: true } } },
      },
    },
  });

  return <GameweeksClient gameweeks={gameweeks} />;
}