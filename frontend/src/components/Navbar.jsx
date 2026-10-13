import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import {
  HiMenu,
  HiX,
  HiLogout,
  HiViewGrid,
  HiHome,
  HiCollection,
  HiSupport,
  HiShoppingCart,
  HiShieldCheck,
} from 'react-icons/hi';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { count: cartCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const closeMenusOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', closeMenusOnEscape);
    return () => document.removeEventListener('keydown', closeMenusOnEscape);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
    setIsOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-full transition-colors duration-200 border ${
      isActive
        ? 'bg-primary-dim/10 text-primary-dim border-primary-dim/40 font-semibold'
        : 'text-outline border-transparent hover:bg-surface-highest hover:text-white font-medium'
    }`;

  const cartLabel = cartCount > 0
    ? `Cart, ${cartCount} ${cartCount === 1 ? 'project' : 'projects'}`
    : 'Cart';

  return (
    <nav aria-label="Main navigation" className="bg-surface-lowest/80 backdrop-blur-lg border-b border-surface-variant/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link to="/" aria-label="Inovitaz home" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <svg aria-hidden="true" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-xl font-display font-bold text-white tracking-widest uppercase">Inovitaz</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={navLinkClass}>
              <HiHome aria-hidden="true" className="w-5 h-5" />
              Home
            </NavLink>
            <NavLink to="/projects" className={navLinkClass}>
              <HiCollection aria-hidden="true" className="w-5 h-5" />
              Projects
            </NavLink>
            <NavLink to="/support" className={navLinkClass}>
              <HiSupport aria-hidden="true" className="w-5 h-5" />
              Support
            </NavLink>
            <NavLink to="/cart" aria-label={cartLabel} className={navLinkClass}>
              <span aria-hidden="true" className="relative">
                <HiShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </span>
              Cart
            </NavLink>

            {isAuthenticated && (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  <HiViewGrid aria-hidden="true" className="w-5 h-5" />
                  Dashboard
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin" className={navLinkClass}>
                    <HiShieldCheck aria-hidden="true" className="w-5 h-5" />
                    Admin
                  </NavLink>
                )}

                <div className="relative ml-2">
                  <button
                    type="button"
                    onClick={() => setShowDropdown((open) => !open)}
                    aria-expanded={showDropdown}
                    aria-haspopup="menu"
                    aria-controls="account-menu"
                    className="flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-full bg-surface-highest border border-surface-variant hover:bg-surface-bright transition-colors"
                  >
                    <span aria-hidden="true" className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                    </span>
                    <span className="text-white font-medium max-w-[100px] truncate">{user?.name}</span>
                  </button>

                  {showDropdown && (
                    <>
                      <button
                        type="button"
                        aria-label="Close account menu"
                        className="fixed inset-0 z-10 cursor-default"
                        onClick={() => setShowDropdown(false)}
                      />
                      <div
                        id="account-menu"
                        role="menu"
                        aria-label="Account menu"
                        className="absolute right-0 mt-2 w-48 bg-surface-highest rounded-xl border border-surface-variant py-1 fade-in z-20"
                      >
                        <div className="px-4 py-2 border-b border-surface-variant" role="presentation">
                          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                          <p className="text-xs text-outline truncate">{user?.email}</p>
                        </div>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-left text-danger-fg hover:bg-danger/10 transition-colors rounded-lg"
                        >
                          <HiLogout aria-hidden="true" className="w-5 h-5" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="flex items-center gap-2 ml-4">
                <Link to="/login" className="px-4 py-2.5 min-h-[44px] inline-flex items-center text-outline hover:text-white font-medium transition-colors text-sm">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary text-sm">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
                    className="w-11 h-11 inline-flex items-center justify-center rounded-full text-outline hover:bg-surface-highest hover:text-white transition-colors"
                  >
                    {isOpen ? <HiX aria-hidden="true" className="w-6 h-6" /> : <HiMenu aria-hidden="true" className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div id="mobile-navigation" aria-label="Mobile navigation" className="md:hidden bg-surface-lowest border-t border-surface-variant fade-in absolute w-full">
          <div className="px-4 py-4 space-y-2">
            <NavLink to="/" className={navLinkClass} onClick={() => setIsOpen(false)}>
              <HiHome aria-hidden="true" className="w-5 h-5" /> Home
            </NavLink>
            <NavLink to="/projects" className={navLinkClass} onClick={() => setIsOpen(false)}>
              <HiCollection aria-hidden="true" className="w-5 h-5" /> Projects
            </NavLink>
            <NavLink to="/support" className={navLinkClass} onClick={() => setIsOpen(false)}>
              <HiSupport aria-hidden="true" className="w-5 h-5" /> Support
            </NavLink>
            <NavLink to="/cart" aria-label={cartLabel} className={navLinkClass} onClick={() => setIsOpen(false)}>
              <span aria-hidden="true" className="relative">
                <HiShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </span>
              Cart
            </NavLink>

            {isAuthenticated && (
              <>
                <NavLink to="/dashboard" className={navLinkClass} onClick={() => setIsOpen(false)}>
                  <HiViewGrid aria-hidden="true" className="w-5 h-5" /> Dashboard
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin" className={navLinkClass} onClick={() => setIsOpen(false)}>
                    <HiShieldCheck aria-hidden="true" className="w-5 h-5" /> Admin Panel
                  </NavLink>
                )}
                <div className="pt-4 border-t border-surface-variant/30">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div aria-hidden="true" className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">{user?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-white truncate">{user?.name}</p>
                      <p className="text-sm text-outline truncate">{user?.email}</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 min-h-[44px] mt-2 text-danger-fg hover:bg-danger/10 rounded-full transition-colors">
                    <HiLogout aria-hidden="true" className="w-5 h-5" /> Logout
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="pt-4 border-t border-surface-variant/30 space-y-2">
                <Link to="/login" className="block w-full text-center px-4 py-2.5 min-h-[44px] text-outline hover:text-white hover:bg-surface-highest rounded-full font-medium transition-colors" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
                <Link to="/signup" className="block w-full btn btn-primary text-center" onClick={() => setIsOpen(false)}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
