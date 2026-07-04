import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  headerAction?: ReactNode;
}

export default function AdminLayout({ children, title, description, headerAction }: AdminLayoutProps) {
  const mobileLinks = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Analytics', path: '/admin/analytics' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Ads', path: '/admin/ads' },
    { label: 'Reports', path: '/admin/reports' },
    { label: 'Reviews', path: '/admin/reviews' },
    { label: 'Verification', path: '/admin/verification' },
    { label: 'Audit Log', path: '/admin/audit-log' },
    { label: 'Communications', path: '/admin/communications' },
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f5] lg:flex">
      {/* Sidebar */}
      <AdminSidebar className="hidden lg:block" />

      {/* Main Content */}
      <main className="min-w-0 flex-1 lg:ml-[240px]">
        <div className="border-b border-[#e8e8ea] bg-white px-4 py-3 lg:hidden">
          <NavLink className="text-2xl font-normal text-[#ff9715]" to="/admin">
            qwik
          </NavLink>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {mobileLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/admin'}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium ${
                    isActive ? 'bg-[#fff0e6] text-[#ff9715]' : 'bg-[#f3f3f5] text-[#7f7e88]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="min-h-screen p-4 sm:p-6 lg:p-7">
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-6 sm:mb-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="mb-1.5 text-[28px] font-normal leading-tight text-[#1f1f29] sm:text-[34px]">{title}</h1>
                {description && (
                  <p className="text-[#7f7e88] text-sm">{description}</p>
                )}
              </div>
              {headerAction && <div className="shrink-0">{headerAction}</div>}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
