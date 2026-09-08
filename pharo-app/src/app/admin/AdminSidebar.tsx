'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/admin', label: 'Dashboard', icon: '□' },
  { href: '/admin/matches', label: 'Matches', icon: '⚽' },
  { href: '/admin/players', label: 'Players', icon: '👥' },
  { href: '/admin/gameweeks', label: 'Gameweeks', icon: '📅' },
  { href: '/admin/points', label: 'Points', icon: '⭐' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-logo">⚡</span>
        <div className="admin-sidebar-brand-text">
          <strong>PHARO</strong>
          <span>FANTASY</span>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {links.map((link) => {
          const active =
            link.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-nav-link ${active ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <Link href="/" className="admin-nav-link">
          <span className="admin-nav-icon">🏠</span>
          <span>View Site</span>
        </Link>
      </div>
    </aside>
  );
}