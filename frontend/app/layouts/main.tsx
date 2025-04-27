import { Outlet, NavLink, redirect, useNavigate } from "react-router";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/main";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const username = session.get("username");
  return { username };
}

export default function MainLayout({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { username } = loaderData;
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <NavLink to="/" className="text-2xl font-bold text-blue-600">Scholark</NavLink>
            </div>
            <nav className="flex space-x-4 items-center">
              {username ?
                <div>
                  <NavLink
                    to="/conferences"
                    className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-blue-600' : 'text-zinc-600 hover:text-blue-600'}`}
                  >
                    Conferences
                  </NavLink>
                  <NavLink
                    to="/timeline"
                    className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-blue-600' : 'text-zinc-600 hover:text-blue-600'}`}
                  >
                    Timeline
                  </NavLink></div>
                :
                <NavLink
                  to="/login"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-blue-600' : 'text-zinc-600 hover:text-blue-600'}`}
                >
                  Login
                </NavLink>}
              {/* Display username and avatar if logged in */}
              {username && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/path/to/avatar.jpg" alt="User Avatar" />
                      <AvatarFallback>{username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-zinc-600">{username}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>{username}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Profile
                      <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Settings
                      <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate("/logout")}>
                      Logout
                      <DropdownMenuShortcut>⌘L</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
