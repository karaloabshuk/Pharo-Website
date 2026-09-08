import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

function requireAdmin(session: { role?: string } | null) {
  if (!session || session.role !== 'ADMIN') return false;
  return true;
}

export async function GET() {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const gameweeks = await prisma.gameweek.findMany({
      orderBy: { number: 'asc' },
      include: {
        matches: true,
      },
    });
    return NextResponse.json({ gameweeks });
  } catch (error) {
    console.error('Fetch gameweeks error:', error);
    return NextResponse.json({ error: 'Failed to fetch gameweeks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { number, name, status } = body;

    if (!number) {
      return NextResponse.json({ error: 'number is required' }, { status: 400 });
    }

    const existing = await prisma.gameweek.findUnique({
      where: { number: Number(number) },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Gameweek ${number} already exists` },
        { status: 400 }
      );
    }

    const gameweek = await prisma.gameweek.create({
      data: {
        number: Number(number),
        name: name || `Gameweek ${number}`,
        status: status || 'PENDING',
      },
    });

    return NextResponse.json({ gameweek }, { status: 201 });
  } catch (error) {
    console.error('Create gameweek error:', error);
    return NextResponse.json({ error: 'Failed to create gameweek' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, name } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (name) data.name = name;

    const gameweek = await prisma.gameweek.update({
      where: { id },
      data,
    });

    return NextResponse.json({ gameweek });
  } catch (error) {
    console.error('Update gameweek error:', error);
    return NextResponse.json({ error: 'Failed to update gameweek' }, { status: 500 });
  }
}