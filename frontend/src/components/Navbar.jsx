// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  HiMenu,
  HiX,
  HiLogout,
  HiViewGrid,
  HiHome,
  HiCollection,
  HiSupport,
  HiShieldCheck, // Changed from HiShoppingCart for Admin
} from 'react-icons/hi';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
    setIsOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-100 text-primary-700 font-medium'
        : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
    }`;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
{/* Replace Logo Section with this: */}
<Link to="/" className="flex items-center gap-2 group">
  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
    {/* Microchip Icon */}
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  </div>
  <span className="text-xl font-bold text-secondary-900 tracking-tight">Inovitaz</span>
</Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={navLinkClass}>
              <HiHome className="w-5 h-5" />
              Home
            </NavLink>

            <NavLink to="/projects" className={navLinkClass}>
              <HiCollection className="w-5 h-5" />
              Projects
            </NavLink>

            <NavLink to="/support" className={navLinkClass}>
              <HiSupport className="w-5 h-5" />
              Support
            </NavLink>

            {isAuthenticated && (
              <>
                {/* Dashboard for logged-in users */}
                <NavLink to="/dashboard" className={navLinkClass}>
                  <HiViewGrid className="w-5 h-5" />
                  Dashboard
                </NavLink>

                {/* Admin link only for admins */}
                {isAdmin && (
                  <NavLink to="/admin" className={navLinkClass}>
                    <HiShieldCheck className="w-5 h-5" />
                    Admin
                  </NavLink>
                )}

                {/* User Dropdown */}
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary-100 hover:bg-secondary-200 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-secondary-700 font-medium max-w-[100px] truncate">
                      {user?.name}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <>
                      {/* Invisible backdrop to close menu when clicking outside */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowDropdown(false)}
                      ></div>
                      
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 fade-in z-20">
                        <div className="px-4 py-2 border-b border-secondary-100">
                          <p className="text-sm font-medium text-secondary-900 truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-secondary-500 truncate">
                            {user?.email}
                          </p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <HiLogout className="w-5 h-5" />
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
                <Link
                  to="/login"
                  className="px-4 py-2 text-secondary-600 hover:text-secondary-900 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100"
            >
              {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-secondary-200 fade-in absolute w-full shadow-lg">
          <div className="px-4 py-4 space-y-2">
            <NavLink
              to="/"
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <HiHome className="w-5 h-5" />
              Home
            </NavLink>

            <NavLink
              to="/projects"
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <HiCollection className="w-5 h-5" />
              Projects
            </NavLink>

            <NavLink
              to="/support"
              className={navLinkClass}
              onClick={() => setIsOpen(false)}
            >
              <HiSupport className="w-5 h-5" />
              Support
            </NavLink>

            {isAuthenticated && (
              <>
                <NavLink
                  to="/dashboard"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  <HiViewGrid className="w-5 h-5" />
                  Dashboard
                </NavLink>

                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className={navLinkClass}
                    onClick={() => setIsOpen(false)}
                  >
                    <HiShieldCheck className="w-5 h-5" />
                    Admin Panel
                  </NavLink>
                )}

                <div className="pt-4 border-t border-secondary-200">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-secondary-900 truncate">{user?.name}</p>
                      <p className="text-sm text-secondary-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <HiLogout className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="pt-4 border-t border-secondary-200 space-y-2">
                <Link
                  to="/login"
                  className="block w-full text-center px-4 py-2 text-secondary-600 hover:bg-secondary-100 rounded-lg font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block w-full btn btn-primary text-center"
                  onClick={() => setIsOpen(false)}
                >
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