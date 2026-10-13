/**
 * AdminStats — overview tiles + recent orders (extracted from AdminDashboard).
 */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { HiCurrencyRupee, HiShoppingCart, HiUsers, HiCollection } from "react-icons/hi";
import { adminProjectsAPI } from "../../api/projects";
import { formatINRFromPaise } from "../../utils/price";
import AdminSkeleton from "./AdminSkeleton";

const formatPaiseToINR = formatINRFromPaise;

// ================== Admin Stats ==================
const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminProjectsAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = formatPaiseToINR;

  if (loading) {
    return <AdminSkeleton type="stats" />;
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="t-label text-outline mb-1">Total Revenue</p>
              <p className="t-num text-white mt-1">
                {formatPrice(stats?.totalRevenue || 0)}
              </p>
            </div>
            <div className="icon-tile icon-tile-green">
              <HiCurrencyRupee className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="t-label text-outline mb-1">Total Orders</p>
              <p className="t-num text-white mt-1">
                {stats?.totalOrders || 0}
              </p>
            </div>
            <div className="icon-tile icon-tile-blue">
              <HiShoppingCart className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="t-label text-outline mb-1">Total Users</p>
              <p className="t-num text-white mt-1">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <div className="icon-tile icon-tile-purple">
              <HiUsers className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="t-label text-outline mb-1">Total Projects</p>
              <p className="t-num text-white mt-1">
                {stats?.totalProjects || 0}
              </p>
            </div>
            <div className="icon-tile icon-tile-orange">
              <HiCollection className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="p-6 border-b border-surface-variant">
          <h2 className="text-lg font-semibold text-white">
            Recent Orders
          </h2>
        </div>
        <div className="p-6">
          {stats?.recentOrders?.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-surface-variant last:border-0"
                >
                  <div>
                    <p className="font-medium text-white">
                      {order.project_title}
                    </p>
                    <p className="text-sm text-outline">
                      {order.user_email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="t-num text-white">
                      {formatPrice(order.amount)}
                    </p>
                    <p className="text-sm text-outline">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-outline text-center py-4">
              No recent orders
            </p>
          )}
        </div>
      </div>
    </div>
  );
};


export default AdminStats;
