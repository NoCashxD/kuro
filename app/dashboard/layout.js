'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Key, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  BarChart3,
  FileText,
  Shield,
  Sun,
  Moon
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/AuthContext';

export default function DashboardLayout({ children }) {
  const { user, loading, logout, isOwner, isAdmin, isDev } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, level: 3 },
    { name: 'Users', href: '/dashboard/users', icon: Users, level: 2 }, // Only Admin and above can see Users
    { name: 'Keys', href: '/dashboard/keys', icon: Key, level: 3 },
    { name: 'Statistics', href: '/dashboard/stats', icon: BarChart3, level: 2 },
    { name: 'History', href: '/dashboard/history', icon: FileText, level: 2 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, level: 1 },
    // New: Balance Transfer (Owner/Admin only)
    ...(user.level <= 2 ? [{ name: 'Transfer Balance', href: '/dashboard/users/transfer-balance', icon: Key, level: 2 }] : []),
    // Removed: Owner Server Link (feature deleted)
  ].filter(item => user.level <= item.level);

  const getRoleBadge = () => {
    if (user.level === 0) return { text: 'Dev', color: 'bg-purple-600' };
    if (user.level === 1) return { text: 'Owner', color: 'bg-red-600' };
    if (user.level === 2) return { text: 'Admin', color: 'bg-blue-600' };
    return { text: 'Reseller', color: 'bg-green-600' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-background min-[768px]:flex font-mono">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.3)] backdrop-blur-[2px] bg-opacity-70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`max-[768px]:fixed sticky inset-y-0 left-0 z-50 w-64 bg-accent flex flex-col h-screen transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-accent flex-shrink-0">
          <div className="flex items-center">
            <span className="ml-2 text-xl font-bold text-text font-mono spbl">Kuro Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-text"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {/* Scrollable nav area */}
        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded transition-colors font-mono ${
                    isActive
                      ? 'bg-blue-600 text-text shadow-card'
                      : ' hover:bg-[#232323] hover:text-text'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              );
            })}
          </div>
        </nav>
        {/* User info stays at the bottom */}
        <div className="p-4 border-t border-accent flex-shrink-0">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-[#232323] rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-text font-mono">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-text font-mono">{user.fullname}</p>
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleBadge.color} text-text`}>
                  {roleBadge.text}
                </span>
                <span className="ml-2 text-xs text-gray-400 font-mono">
                  Saldo: ${user.saldo}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full flex items-center px-3 py-2 text-sm font-medium  hover:bg-[#232323] hover:text-text rounded transition-colors font-mono"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0 ">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-accent border-b border-accent w-full h-[64px]">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-text"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1 rounded bg-gray-700 text-text hover:bg-gray-600 border border-gray-600"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 font-mono mainfile">
          {children}
        </main>
      </div>
    </div>
  );
} 