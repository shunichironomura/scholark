import { Outlet, NavLink } from "react-router";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <NavLink to="/" className="text-2xl font-bold text-blue-600">Scholark</NavLink>
            </div>
            <nav className="flex space-x-4">
              <NavLink
                to="/conferences"
                className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-blue-600' : 'text-zinc-600 hover:text-blue-600'}`}
              >
                Conferences
              </NavLink>
              {/* <NavLink
                to="/research-topics"
                className={"px-3 py-2 rounded-md text-sm font-medium"}
              >
                Research Topics
              </NavLink>
              <NavLink
                to="/schedule"
                className={"px-3 py-2 rounded-md text-sm font-medium"}
              >
                My Schedule
              </NavLink> */}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-zinc-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} Scholark
          </p>
        </div>
      </footer>
    </div>
  );
}
