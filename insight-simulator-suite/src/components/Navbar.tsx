import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useSandbox } from '@/contexts/SandboxContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LayoutDashboard, History, Package, FlaskConical, LogOut, Moon, Sun } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const { isSandboxActive, discardSandbox } = useSandbox();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">MarketMind</span>
            </Link>

            <div className="flex gap-1">
              <Link to="/dashboard">
                <Button
                  variant={isActive('/dashboard') ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/history">
                <Button
                  variant={isActive('/history') ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <History className="h-4 w-4" />
                  History
                </Button>
              </Link>
              <Link to="/products">
                <Button
                  variant={isActive('/products') ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Products
                </Button>
              </Link>
              <Link to="/sandbox">
                <Button
                  variant={isActive('/sandbox') ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <FlaskConical className="h-4 w-4" />
                  Sandbox
                </Button>
              </Link>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="gap-2"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>

          <Button variant="ghost" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      {isSandboxActive && (
        <div className="bg-yellow-100 p-2 text-sm border-t">
          Sandbox active. <button onClick={discardSandbox} className="text-blue-600 underline">Discard</button> or commit to save.
        </div>
      )}
    </nav>
  );
};

export { Navbar };
