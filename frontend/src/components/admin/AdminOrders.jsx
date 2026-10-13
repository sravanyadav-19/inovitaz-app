/**
 * AdminOrders — all-orders table (extracted from AdminDashboard).
 */
import { useState, useEffect } from "react";
import { adminProjectsAPI } from "../../api/projects";
import { formatINRFromPaise } from "../../utils/price";
import AdminSkeleton from "./AdminSkeleton";

const formatPaiseToINR = formatINRFromPaise;

// ================== Admin Orders ==================
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await adminProjectsAPI.getAllOrders();
      if (response.success) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = formatPaiseToINR;

  if (loading) {
    return <AdminSkeleton type="table" rows={6} />;
  }

  return (
    <div>
      <h2 className="t-h3 text-white mb-6">
        All Orders
      </h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Order ID
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Customer
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Project
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Amount
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Coupon
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Status
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-outline"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-surface-variant hover:bg-surface"
                  >
                    <td className="py-4 px-4 font-mono text-sm text-outline">
                      #{order.id}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-white">
                          {order.user_name}
                        </p>
                        <p className="text-sm text-outline">
                          {order.user_email}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {order.project_title}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="t-num text-white">
                          {formatPrice(order.amount)}
                        </p>
                        {order.discount_amount > 0 && (
                          <p className="text-xs text-success-fg">
                            -{formatPrice(order.discount_amount)} off
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {order.coupon_code ? (
                        <span className="badge badge-purple">
                          {order.coupon_code}
                        </span>
                      ) : (
                        <span className="text-outline text-xs">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`badge ${
                          order.status === "paid"
                            ? "badge-success"
                            : order.status === "created" || order.status === "pending"
                            ? "badge-warning"
                            : "badge-danger"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-outline">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default AdminOrders;
