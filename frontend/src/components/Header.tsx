import { FileText, Home, LogOut, MessageSquare } from 'lucide-react';
import type { View } from '../types';

interface HeaderProps {
  activeView: View;
  onNavigate: (view: View) => void;
  isAuthenticated: boolean;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export function Header({ activeView, onNavigate, isAuthenticated, onOpenAuth, onLogout }: HeaderProps) {
  const navItems: Array<{ view: View; label: string; icon: React.ReactNode }> = [
    { view: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { view: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
  ];
  if (isAuthenticated) {
    navItems.splice(1, 0, { view: 'upload', label: 'Upload', icon: <FileText className="w-4 h-4" /> });
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h2 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Document Q&A
              </h2>
            </div>
          </button>

          <nav className="flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300
                  ${
                    activeView === item.view
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            )}
            {!isAuthenticated && onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span className="hidden sm:inline">Sign in</span>
                <span className="sm:hidden">Auth</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
