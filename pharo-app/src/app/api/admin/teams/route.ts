import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

function requireAdmin(session: { role?: string } | null) {
  return session?.role === 'ADMIN';
}

export async function GET() {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const teams = await prisma.team.findMany({
      include: {
        players: true,
        _count: { select: { homeMatches: true, awayMatches: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Fetch teams error:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const existing = await prisma.team.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'Team already exists' }, { status: 400 });
    }

    const team = await prisma.team.create({ data: { name } });
    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}