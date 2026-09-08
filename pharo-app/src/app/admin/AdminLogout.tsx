'use client';

import { useRouter } from 'next/navigation';

export default function AdminLogout() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout');
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button className="admin-logout-btn" onClick={handleLogout}>
      Logout
    </button>
  );
}