import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-orange rounded-lg flex items-center justify-center">
              <i className="fas fa-project-diagram text-white text-lg"></i>
            </div>
            <h1 className="text-2xl font-bold text-dark-gray">CauseMapster</h1>
          </Link>
          
          {user && (
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/dashboard" 
                className={`text-medium-gray hover:text-dark-gray transition-colors ${location === "/dashboard" ? "text-primary-orange" : ""}`}
              >
                <i className="fas fa-tachometer-alt mr-2"></i>Tableau de bord
              </Link>
              <Link 
                href="/dashboard" 
                className={`text-medium-gray hover:text-dark-gray transition-colors`}
              >
                <i className="fas fa-list mr-2"></i>Mes Analyses
              </Link>
              <Link 
                href="/account" 
                className={`text-medium-gray hover:text-dark-gray transition-colors ${location === "/account" ? "text-primary-orange" : ""}`}
              >
                <i className="fas fa-user mr-2"></i>Mon Compte
              </Link>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary-orange text-white">
                        {user.firstName?.[0] || user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.firstName && user.lastName && (
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                      )}
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">
                      <i className="fas fa-user mr-2"></i>Mon Compte
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <i className="fas fa-tachometer-alt mr-2"></i>Tableau de bord
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt mr-2"></i>Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">
                    <i className="fas fa-sign-in-alt mr-2"></i>Se connecter
                  </Link>
                </Button>
                <Button asChild className="bg-primary-orange hover:bg-orange-600">
                  <Link href="/register">
                    <i className="fas fa-user-plus mr-2"></i>S'inscrire
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
