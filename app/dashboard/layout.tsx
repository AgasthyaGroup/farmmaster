'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Warehouse, 
  Tag, 
  Users, 
  ShieldCheck,
  Building2,
  Beef as CattleIcon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Tractor
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  installAuthFetchInterceptor,
  isTokenExpired,
  logoutAndRedirect,
} from '@/src/utils/clientAuth';

const TOKEN_CHECK_INTERVAL_MS = 30_000;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const sidebarItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Farms', icon: Tractor, href: '/dashboard/farms' },
  { name: 'Sheds', icon: Warehouse, href: '/dashboard/sheds' },
  { name: 'Tags', icon: Tag, href: '/dashboard/tags' },
  { name: 'Cattle', icon: CattleIcon, href: '/dashboard/cattle' },
  { name: 'Departments', icon: Building2, href: '/dashboard/departments' },
  { name: 'User Management', icon: Users, href: '/dashboard/users' },
  { name: 'Role Management', icon: ShieldCheck, href: '/dashboard/roles' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token || isTokenExpired(token)) {
      logoutAndRedirect();
      return;
    }

    setUser(JSON.parse(storedUser));

    const removeInterceptor = installAuthFetchInterceptor();
    const intervalId = window.setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (!currentToken || isTokenExpired(currentToken)) {
        logoutAndRedirect();
      }
    }, TOKEN_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      removeInterceptor();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const isFarmAdmin = user.role === 'FARM_ADMIN';
    if (isFarmAdmin && (pathname === '/dashboard/users' || pathname === '/dashboard/roles')) {
      router.replace('/dashboard');
    }
  }, [user, pathname, router]);

  const handleLogout = () => {
    logoutAndRedirect();
  };

  if (!user) return null;

  const allowedSidebarItems = sidebarItems.filter((item) => {
    if (user.role === 'FARM_ADMIN' && (item.href === '/dashboard/users' || item.href === '/dashboard/roles')) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-0"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <CattleIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">FarmMaster</span>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {allowedSidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                    isActive 
                      ? "bg-blue-600/10 text-blue-600" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "group-hover:text-blue-600 transition-colors")} />
                  <span className="font-semibold text-sm">{item.name}</span>
                  {isActive && <div className="absolute right-0 w-1 h-6 bg-blue-600 rounded-l-full" />}
                  <ChevronRight className={cn("w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity", isActive && "opacity-100")} />
                </Link>
              );
            })}
          </nav>

          <div className="p-6 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout Account</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 capitalize hidden md:block">
              {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <p className="text-xs font-semibold text-slate-400">{user.role.replace('_', ' ')}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xl shadow-blue-500/20">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-10 relative">
          {children}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
