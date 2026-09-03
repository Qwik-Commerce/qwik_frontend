import { useNavigate, useLocation } from 'react-router-dom';
import { clearAllAuthData } from '../../services/auth';
import { disconnectRealtimeSocket } from '../../services/realtime';
import { api } from '../../services/api';
import { 
  BarChart3, 
  Users, 
  Package, 
  AlertCircle, 
  CheckCircle,
  MessageSquare,
  ClipboardList,
  Mail,
  Gift,
  LogOut 
} from 'lucide-react';

interface AdminSidebarProps {
  className?: string;
}

export default function AdminSidebar({ className = '' }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: BarChart3, path: '/admin' },
    { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Ads', icon: Package, path: '/admin/ads' },
    { label: 'Reports', icon: AlertCircle, path: '/admin/reports' },
    { label: 'Reviews', icon: MessageSquare, path: '/admin/reviews' },
    { label: 'Verification', icon: CheckCircle, path: '/admin/verification' },
    { label: 'Referrals', icon: Gift, path: '/admin/referrals' },
    { label: 'Audit Log', icon: ClipboardList, path: '/admin/audit-log' },
    { label: 'Communications', icon: Mail, path: '/admin/communications' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Local logout must still complete even if backend audit write fails.
    } finally {
      clearAllAuthData();
      disconnectRealtimeSocket();
      navigate('/admin/login');
    }
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-[#e8e8ea] overflow-y-auto ${className}`}>
      {/* Logo */}
      <div className="px-6 py-8 border-b border-[#e8e8ea]">
        <button
          onClick={() => navigate('/admin')}
          className="text-3xl font-normal text-[#ff9715] hover:text-[#e68a0e] transition"
        >
          qwik
        </button>
        <div className="text-xs text-[#9a99a6] font-medium mt-2">Admin Panel</div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive(item.path)
                  ? 'bg-[#fff0e6] text-[#ff9715] border border-[#ff9715]'
                  : 'text-[#7f7e88] hover:bg-[#f9f9fb] hover:text-[#1f1f29]'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive(item.path) && (
                <div className="ml-auto w-2 h-2 rounded-full bg-[#ff9715]"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-6 h-px bg-[#e8e8ea]"></div>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={() => void handleLogout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#d32f2f] hover:bg-[#ffebee] transition text-sm font-medium"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
