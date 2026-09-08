import { NextResponse } from 'next/server';
import { getSession, logout } from '@/lib/auth';

export async function GET() {
  try {
    await logout();
  } catch {
    // ignore
  }
  return NextResponse.json({ success: true });
}