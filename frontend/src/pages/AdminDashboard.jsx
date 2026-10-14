/**
 * AdminDashboard — thin shell: sidebar nav + routed admin views.
 * All views live in ../components/admin/ (folder-hygiene rule:
 * this page no longer carries 1,700+ lines of inline components).
 */

import { Routes, Route, NavLink } from "react-router-dom";
import {
  HiViewGrid,
  HiCollection,
  HiShoppingCart,
  HiUsers,
  HiTag,
} from "react-icons/hi";
import AdminStats from "../components/admin/AdminStats";
import AdminProjects from "../components/admin/AdminProjects";
import AdminOrders from "../components/admin/AdminOrders";
import AdminUsers from "../components/admin/AdminUsers";
import AdminCoupons from "../components/admin/AdminCoupons";

const AdminDashboard = () => {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? "bg-primary/10 text-primary-dim font-semibold ring-1 ring-primary-dim/40"
        : "text-outline hover:bg-surface-high hover:text-white"
    }`;

  return (
    <div className="min-h-[100dvh] fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="card p-4 sticky top-24">
              <h2 className="t-label text-outline px-4 py-2 mb-2">
                Admin panel
              </h2>
              <nav className="space-y-1">
                <NavLink to="/admin" end className={navLinkClass}>
                  <HiViewGrid className="w-5 h-5" /> Dashboard
                </NavLink>
                <NavLink to="/admin/projects" className={navLinkClass}>
                  <HiCollection className="w-5 h-5" /> Projects
                </NavLink>
                <NavLink to="/admin/orders" className={navLinkClass}>
                  <HiShoppingCart className="w-5 h-5" /> Orders
                </NavLink>
                <NavLink to="/admin/users" className={navLinkClass}>
                  <HiUsers className="w-5 h-5" /> Users
                </NavLink>
                <NavLink to="/admin/coupons" className={navLinkClass}>
                  <HiTag className="w-5 h-5" /> Coupons
                </NavLink>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <Routes>
              <Route index element={<AdminStats />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="coupons" element={<AdminCoupons />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;