import React from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigate, currentPage }) => {
  if (!user) {
    return <div className="min-h-screen bg-background dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-auto md:h-screen sticky top-0 z-40 shadow-sm transition-colors duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">LearnFlow</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${currentPage === 'dashboard' ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Dashboard</span>
          </button>
          
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Your Account
          </div>
          
          <div className="px-4 py-2 flex items-center space-x-3 text-slate-600 dark:text-slate-400">
             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-300">
                {user.displayName?.[0] || 'U'}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-700 dark:text-slate-200">{user.displayName}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
             </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log Out</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;