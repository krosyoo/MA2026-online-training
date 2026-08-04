import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, BookOpen, LogOut, LogIn, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  user: {
    name: string;
    role: 'student' | 'admin';
    mustChangePassword?: boolean;
  } | null;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: '홈' },
    { href: '/courses', label: '전체 강의' },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <span className="flex items-center gap-2 hover-elevate rounded-md px-3 py-2 transition-all cursor-pointer" data-testid="link-home">
              <BookOpen className="h-6 w-6 text-brand-primary" />
              <span className="text-lg font-semibold text-brand-primary">마하나임 훈련시스템</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all hover-elevate cursor-pointer inline-block ${
                    isActive(link.href)
                      ? 'bg-brand-light text-brand-primary'
                      : 'text-gray-700'
                  }`}
                  data-testid={`link-${link.label}`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
            
            {user ? (
              <>
                <Link href="/my-status">
                  <span
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all hover-elevate cursor-pointer inline-block ${
                      isActive('/my-status')
                        ? 'bg-brand-light text-brand-primary'
                        : 'text-gray-700'
                    }`}
                    data-testid="link-my-status"
                  >
                    나의 수강현황
                  </span>
                </Link>
                
                {user.role === 'admin' && (
                  <Link href="/admin">
                    <span
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all hover-elevate cursor-pointer inline-block ${
                        isActive('/admin')
                          ? 'bg-brand-light text-brand-primary'
                          : 'text-gray-700'
                      }`}
                      data-testid="link-admin"
                    >
                      관리자
                    </span>
                  </Link>
                )}
                
                <div className="flex items-center gap-2 ml-2 pl-2 border-l">
                  <Link href="/profile">
                    <span
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all hover-elevate cursor-pointer inline-flex items-center gap-1 ${
                        isActive('/profile')
                          ? 'bg-brand-light text-brand-primary'
                          : 'text-gray-700'
                      }`}
                      data-testid="link-profile"
                    >
                      {user.mustChangePassword && (
                        <AlertTriangle className="h-4 w-4 text-destructive" data-testid="icon-must-change-password" />
                      )}
                      <span data-testid="text-username">{user.name}</span>
                    </span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    data-testid="button-logout"
                    className="gap-1"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="default" size="sm" className="ml-2 gap-1" data-testid="button-login" asChild>
                  <span className="cursor-pointer">
                    <LogIn className="h-4 w-4" />
                    로그인/가입
                  </span>
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover-elevate rounded-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
            aria-label="메뉴"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all hover-elevate cursor-pointer inline-block w-full ${
                      isActive(link.href)
                        ? 'bg-brand-light text-brand-primary'
                        : 'text-gray-700'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`link-mobile-${link.label}`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              
              {user ? (
                <>
                  <Link href="/my-status">
                    <span
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all hover-elevate cursor-pointer inline-block w-full ${
                        isActive('/my-status')
                          ? 'bg-brand-light text-brand-primary'
                          : 'text-gray-700'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="link-mobile-my-status"
                    >
                      나의 수강현황
                    </span>
                  </Link>
                  
                  {user.role === 'admin' && (
                    <Link href="/admin">
                      <span
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all hover-elevate cursor-pointer inline-block w-full ${
                          isActive('/admin')
                            ? 'bg-brand-light text-brand-primary'
                            : 'text-gray-700'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="link-mobile-admin"
                      >
                        관리자
                      </span>
                    </Link>
                  )}
                  
                  <Link href="/profile">
                    <span
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all hover-elevate cursor-pointer inline-flex items-center gap-1 w-full ${
                        isActive('/profile')
                          ? 'bg-brand-light text-brand-primary'
                          : 'text-gray-700'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="link-mobile-profile"
                    >
                      {user.mustChangePassword && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      내 정보
                    </span>
                  </Link>

                  <div className="px-4 py-2 border-t mt-2 pt-4">
                    <p className="text-sm text-gray-600 mb-2" data-testid="text-mobile-username">{user.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onLogout();
                        setMobileMenuOpen(false);
                      }}
                      data-testid="button-mobile-logout"
                      className="w-full justify-start gap-1"
                    >
                      <LogOut className="h-4 w-4" />
                      로그아웃
                    </Button>
                  </div>
                </>
              ) : (
                <Link href="/auth">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full gap-1"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="button-mobile-login"
                    asChild
                  >
                    <span className="cursor-pointer">
                      <LogIn className="h-4 w-4" />
                      로그인/가입
                    </span>
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
