// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  HiMenu,
  HiX,
  HiUser,
  HiLogout,
  HiViewGrid,
  HiShoppingCart,
  HiHome,
  HiCollection,
  HiSupport,
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
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <span className="text-xl font-bold text-secondary-900">Inovitaz</span>
            </Link>
          </div>

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
                <NavLink to="/dashboard" className={navLinkClass}>
                  <HiViewGrid className="w-5 h-5" />
                  Dashboard
                </NavLink>

                {isAdmin && (
                  <NavLink to="/admin" className={navLinkClass}>
                    <HiShoppingCart className="w-5 h-5" />
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
                    <span className="text-secondary-700 font-medium">
                      {user?.name}
                    </span>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 fade-in">
                      <div className="px-4 py-2 border-b border-secondary-100">
                        <p className="text-sm font-medium text-secondary-900">
                          {user?.name}
                        </p>
                        <p className="text-xs text-secondary-500">
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
          <div className="md:hidden flex items_center">
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
        <div className="md:hidden bg-white border-t border-secondary-200 fade-in">
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
                    <HiShoppingCart className="w-5 h-5" />
                    Admin
                  </NavLink>
                )}

                <div className="pt-4 border-t border-secondary-200">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">
                        {user?.name}
                      </p>
                      <p className="text-sm text-secondary-500">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
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