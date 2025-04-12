import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();

  // Helper function to determine if a link is active
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/conferences';
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">Scholark</Link>
            </div>
            <nav className="flex space-x-4">
              <Link
                to="/conferences"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/') ? 'text-blue-600' : 'text-zinc-600 hover:text-blue-600'
                  }`}
              >
                Conferences
              </Link>
              <Link
                to="/research-topics"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/research-topics') ? 'text-blue-600' : 'text-zinc-600 hover:text-blue-600'
                  }`}
              >
                Research Topics
              </Link>
              <Link
                to="#"
                className="text-zinc-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Calendar
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="bg-white border-t border-zinc-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} Scholark - A minimalist, flexible SaaS tool for researchers
          </p>
        </div>
      </footer>
    </div>
  );
}
