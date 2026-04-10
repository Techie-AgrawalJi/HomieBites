import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Moon, Sun, Menu, X, Home, Building2, UtensilsCrossed, MapPin, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const navRef = useRef<HTMLElement>(null);
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useGSAP(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity' }
    );
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'superadmin') return '/admin';
    if (user.role === 'provider') return '/provider';
    return '/dashboard';
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: <Home size={16} /> },
    { to: '/pg', label: 'PG Listings', icon: <Building2 size={16} /> },
    { to: '/meals', label: 'Meal Services', icon: <UtensilsCrossed size={16} /> },
    { to: '/discover', label: 'Search Nearby', icon: <MapPin size={16} /> },
  ];

  return (
    <nav
      ref={navRef}
      className={`sticky top-0 z-50 glass px-3 sm:px-6 md:px-12 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-3 sm:py-4'}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="font-heading text-lg sm:text-xl font-bold">
            Homie<span className="text-amber-500">Bites</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium transition-colors hover:text-amber-500 ${location.pathname === to ? 'text-amber-500' : 'opacity-70'}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-full glass hover:bg-amber-500/10 transition-colors" aria-label="Toggle theme">
            {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Link to={getDashboardLink()} className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium hover:border-amber-500/50 transition-all">
                <LayoutDashboard size={16} className="text-amber-500" />
                {user.name.split(' ')[0]}
              </Link>
              <button onClick={handleLogout} className="p-2 rounded-full glass hover:bg-red-500/10 transition-colors text-red-400">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-full glass hover:border-amber-500/50 transition-all">Login</Link>
              <Link to="/signup" className="text-sm font-medium px-4 py-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors">Sign Up</Link>
            </div>
          )}

          <button className="md:hidden p-2 rounded-full glass" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-3 py-3 border-t border-[var(--border)] flex flex-col gap-3">
          {navLinks.map(({ to, label, icon }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-2 py-1 hover:text-amber-500 transition-colors">
              {icon}{label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-2 py-1 hover:text-amber-500">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 px-2 py-1 text-red-400">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-medium glass hover:border-amber-500/50 transition-all">Login</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
