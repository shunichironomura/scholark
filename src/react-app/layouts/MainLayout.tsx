import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Scholark</h1>
            </div>
            <nav className="flex space-x-4">
              <a href="#" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Conferences
              </a>
              <a href="#" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Research Topics
              </a>
              <a href="#" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Calendar
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Scholark - A minimalist, flexible SaaS tool for researchers
          </p>
        </div>
      </footer>
    </div>
  );
}
