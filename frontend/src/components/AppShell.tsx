import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Flame,
  LayoutDashboard,
  LogOut,
  Moon,
  Shield,
  Sun,
  Trophy,
  UserRound,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { levelFromXp, levelTitle } from "@metauni/shared";
import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Logo } from "@/components/Logo";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: "/panel", label: "Panel", icon: LayoutDashboard },
  { to: "/carreras", label: "Carreras", icon: GraduationCap },
  { to: "/logros", label: "Logros", icon: Trophy },
  { to: "/perfil", label: "Perfil", icon: UserRound },
  { to: "/admin", label: "Admin", icon: Shield, adminOnly: true },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Cambiar tema">
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}

function UserMenu() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;
  const xp = levelFromXp(user.xp);

  const handleLogout = async () => {
    await logout();
    navigate("/iniciar-sesion");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border/70 bg-card p-1 pr-3 text-left transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-semibold text-white">
            {initials(user.name)}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-xs font-medium leading-tight">{user.name}</span>
            <span className="block text-[10px] leading-tight text-muted-foreground">
              Nv. {xp.level} · {levelTitle(xp.level)}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
          <p className="truncate text-xs font-normal">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/perfil")}>
          <UserRound /> Mi perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/logros")}>
          <Trophy /> Mis logros
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem onClick={() => navigate("/admin")}>
            <Shield /> Panel admin
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut /> Cerrar sesion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell() {
  const { user, isAdmin } = useAuth();
  const items = NAV.filter((item) => !item.adminOnly || isAdmin);
  const xp = user ? levelFromXp(user.xp) : null;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/70 bg-card/40 backdrop-blur lg:flex">
        <div className="px-5 py-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )
              }
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && xp ? (
          <div className="space-y-3 p-4">
            <Link
              to="/perfil"
              className="block rounded-xl border border-border/70 bg-background/60 p-3 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary">Nivel {xp.level}</span>
                <span className="text-muted-foreground">{levelTitle(xp.level)}</span>
              </div>
              <Progress value={xp.progress} className="mt-2 h-1.5" />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  {xp.xpIntoLevel}/{xp.xpIntoLevel + xp.xpToNextLevel} XP
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="size-3 text-orange-500" /> {user.streak}
                </span>
              </div>
            </Link>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                <Sparkles className="size-3.5" /> {user.xp} XP total
              </span>
              <ThemeToggle />
            </div>
          </div>
        ) : null}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/80 px-4 py-2.5 backdrop-blur lg:hidden">
        <Logo compact />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-border/70 bg-background/70 px-8 py-3 backdrop-blur lg:flex">
          <div className="text-sm text-muted-foreground">
            {user ? (
              <span>
                Hola, <span className="font-medium text-foreground">{user.name.split(" ")[0]}</span> · segui
                construyendo tu progreso
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 px-2 py-1.5 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
