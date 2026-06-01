'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { HeartHandshake, Bell, Menu, X, User, LogOut, MessageSquare } from 'lucide-react';

interface NavbarProps {
  user: {
    name: string;
    role: string;
    email: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.refresh();
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const isLinkActive = (path: string) => {
    return pathname.startsWith(path);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return '/admin/dashboard';
    if (user.role === 'CHARITY_ADMIN') return '/charity/dashboard';
    if (user.role === 'DONOR') return '/donor/dashboard';
    if (user.role === 'BENEFICIARY') return '/beneficiary/dashboard';
    return '/';
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand name */}
          <div className="flex items-center">
            <Link href={getDashboardLink()} className="flex items-center gap-2 group">
              <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-white shadow-md shadow-emerald-200 transition-transform duration-300 group-hover:rotate-6">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                KhairLink
              </span>
              <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                Governance
              </span>
            </Link>
          </div>

          {/* Center Navigation Links (Role Specific) */}
          <div className="hidden md:flex items-center space-x-1">
            {user && (
              <>
                <Link
                  href={getDashboardLink()}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.includes('/dashboard')
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  Dashboard
                </Link>

                {user.role === 'DONOR' && (
                  <>
                    <Link
                      href="/donor/map"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isLinkActive('/donor/map')
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      Map Discovery
                    </Link>
                  </>
                )}

                {user.role === 'CHARITY_ADMIN' && (
                  <>
                    <Link
                      href="/charity/search"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isLinkActive('/charity/search')
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      Beneficiary Search
                    </Link>
                  </>
                )}

                {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                  <>
                    <Link
                      href="/admin/charities"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isLinkActive('/admin/charities')
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      Charities
                    </Link>
                    <Link
                      href="/admin/donors"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isLinkActive('/admin/donors')
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      Donors
                    </Link>
                  </>
                )}

                {/* Common Protected Paths */}
                <Link
                  href="/chat"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isLinkActive('/chat')
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>

                <Link
                  href="/transactions"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isLinkActive('/transactions')
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  History
                </Link>

                <Link
                  href="/resources"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isLinkActive('/resources')
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  Resources
                </Link>

                {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'CHARITY_ADMIN') && (
                  <Link
                    href="/reports"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isLinkActive('/reports')
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Audit & Reports
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Section: User details or Sign In */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 relative">
                {/* Notifications Icon */}
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full relative transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-3 pr-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-slate-700 transition-colors"
                  >
                    <span className="text-xs font-semibold max-w-[100px] truncate hidden md:inline">
                      {user.name}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-lg shadow-slate-100 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-slate-50">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-slate-900 text-sm font-semibold px-4 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-md shadow-emerald-100 hover:shadow-lg hover:shadow-emerald-200 rounded-xl text-sm font-semibold px-5 py-2.5 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-500 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-b border-slate-100 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href={getDashboardLink()}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>

            {user.role === 'DONOR' && (
              <Link
                href="/donor/map"
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Map Discovery
              </Link>
            )}

            {user.role === 'CHARITY_ADMIN' && (
              <Link
                href="/charity/search"
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Beneficiary Search
              </Link>
            )}

            <Link
              href="/chat"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Messages
            </Link>

            <Link
              href="/transactions"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              History
            </Link>

            <Link
              href="/resources"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Resources
            </Link>

            {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'CHARITY_ADMIN') && (
              <Link
                href="/reports"
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Audit & Reports
              </Link>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-rose-600 hover:bg-rose-50"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
