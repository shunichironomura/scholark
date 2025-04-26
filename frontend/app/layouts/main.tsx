import { Outlet, NavLink } from "react-router";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/main";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const username = session.get("username");
  return { username };
}

export default function MainLayout({ loaderData }: Route.ComponentProps) {
  const { username } = loaderData;
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
              {username ? <NavLink
                to="/logout"
                className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-blue-600' : 'text-zinc-600 hover:text-blue-600'}`}
              >
                Logout
              </NavLink> :
                <NavLink
                  to="/login"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-blue-600' : 'text-zinc-600 hover:text-blue-600'}`}
                >
                  Login
                </NavLink>}
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
