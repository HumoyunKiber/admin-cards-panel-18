import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  CreditCard, 
  Store, 
  Map, 
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminLayout = () => {
  const { logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    {
      icon: BarChart3,
      label: 'Statistika',
      path: '/admin',
      active: location.pathname === '/admin'
    },
    {
      icon: CreditCard,
      label: 'Simkarta bazasi',
      path: '/admin/simcards',
      active: location.pathname === '/admin/simcards'
    },
    {
      icon: Store,
      label: 'Magazinlar',
      path: '/admin/shops',
      active: location.pathname === '/admin/shops'
    },
    {
      icon: Map,
      label: 'Xarita',
      path: '/admin/map',
      active: location.pathname === '/admin/map'
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-72 bg-admin-sidebar text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                  item.active 
                    ? "bg-admin-sidebar-active text-white shadow-lg" 
                    : "hover:bg-admin-sidebar-hover text-white/90 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-4 py-2">
            <div className="w-8 h-8 bg-admin-sidebar-active rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">Administrator</p>
              <p className="text-xs text-white/70">admin@company.uz</p>
            </div>
          </div>
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="w-full justify-start gap-3 text-white/90 hover:text-white hover:bg-admin-sidebar-hover"
            disabled={isLoading}
          >
            <LogOut className="h-4 w-4" />
            {isLoading ? 'Chiqilmoqda...' : 'Chiqish'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Boshqaruv paneli
            </h2>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('uz-UZ', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;