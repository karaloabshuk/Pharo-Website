import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminLogout from './AdminLogout';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-topbar">
          <span className="admin-topbar-title">PHARO FANTASY ADMIN</span>
          <AdminLogout />
        </div>
        {children}
      </div>
    </div>
  );
}