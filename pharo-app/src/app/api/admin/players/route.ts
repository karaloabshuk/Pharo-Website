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
    const players = await prisma.player.findMany({
      include: {
        team: true,
        gameweekPoints: {
          orderBy: { gameweek: { number: 'asc' } },
          include: { gameweek: true },
        },
        _count: { select: { events: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ players });
  } catch (error) {
    console.error('Fetch players error:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, position, price, teamId } = await request.json();
    if (!name || !position || !price || !teamId) {
      return NextResponse.json(
        { error: 'name, position, price, and teamId are required' },
        { status: 400 }
      );
    }

    const validPositions = ['GK', 'DEF', 'MID', 'FWD'];
    if (!validPositions.includes(position)) {
      return NextResponse.json({ error: 'Invalid position' }, { status: 400 });
    }

    const player = await prisma.player.create({
      data: {
        name,
        position,
        price: Number(price),
        teamId,
      },
      include: { team: true },
    });

    return NextResponse.json({ player }, { status: 201 });
  } catch (error) {
    console.error('Create player error:', error);
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, name, position, price, teamId } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (position) data.position = position;
    if (price !== undefined) data.price = Number(price);
    if (teamId) data.teamId = teamId;

    const player = await prisma.player.update({
      where: { id },
      data,
      include: { team: true },
    });

    return NextResponse.json({ player });
  } catch (error) {
    console.error('Update player error:', error);
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.player.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete player error:', error);
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 });
  }
}