import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiShoppingBag, HiDownload, HiCheckCircle,
  HiExternalLink, HiHeart, HiExclamationCircle,
  HiCalendar
} from 'react-icons/hi';
import { formatINRFromPaise } from "../utils/price";
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { ordersAPI } from '../api/payments';
import { projectsAPI, wishlistAPI } from '../api/projects';
import LoadingSpinner from '../components/LoadingSpinner';

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="16" fill="#0c1324"/>
      <rect x="20" y="20" width="80" height="80" rx="14" fill="#151b2d" stroke="#3b82f6" stroke-width="3"/>
      <path d="M45 60h30M60 45v30" stroke="#4ae176" stroke-width="6" stroke-linecap="round"/>
      <text x="60" y="102" fill="#8c909f" font-family="Arial" font-size="10" text-anchor="middle">PROJECT</text>
    </svg>
  `);

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [purchasedProjects, setPurchasedProjects] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, purchasedRes, wishlistRes] = await Promise.all([
        ordersAPI.getMyOrders(),
        ordersAPI.getPurchased(),
        wishlistAPI.getAll(),
      ]);

      // Orders
      if (ordersRes?.success && Array.isArray(ordersRes.data?.orders)) {
        setOrders(ordersRes.data.orders);
      } else {
        setOrders([]);
      }

      // Purchased / Downloads
      const downloadsData = purchasedRes?.data?.downloads;
      if (purchasedRes?.success && Array.isArray(downloadsData)) {
        setPurchasedProjects(downloadsData.map(project => ({
          ...project,
          downloads_remaining: project.downloads_remaining ?? 5,
          total_downloads: project.total_downloads ?? 5,
          expiry_date: project.expiry_date || new Date(
            Date.now() + 180 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })));
      } else {
        setPurchasedProjects([]);
      }

      // Wishlist — real API
      if (wishlistRes?.success && Array.isArray(wishlistRes.data)) {
        setWishlist(wishlistRes.data);
      } else {
        setWishlist([]);
      }

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (project) => {
    if (project.downloads_remaining <= 0) {
      toast.error('Download limit reached.');
      return;
    }
    setDownloadingId(project.id);
    try {
      const response = await projectsAPI.download(project.id);
      if (response.success) {
        window.open(response.data.downloadUrl, '_blank');
        toast.success('Download started!');
        setPurchasedProjects(prev =>
          prev.map(p =>
            p.id === project.id
              ? { ...p, downloads_remaining: p.downloads_remaining - 1 }
              : p
          )
        );
      } else {
        toast.error(response.message || 'Download failed');
      }
    } catch (error) {
      toast.error('Download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  const removeFromWishlist = async (projectId) => {
    try {
      const response = await wishlistAPI.remove(projectId);
      if (response.success) {
        setWishlist(prev => prev.filter(item => item.id !== projectId));
        toast.success('Removed from wishlist');
      } else {
        toast.error(response.message || 'Failed to remove');
      }
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const formatPrice = formatINRFromPaise;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: { className: "badge badge-success", text: "Paid" },
      created: { className: "badge badge-warning", text: "Pending" },
      failed: { className: "badge badge-danger", text: "Failed" },
    };
  
    const badge = badges[status] || badges.created;
  
    return <span className={badge.className}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-lowest fade-in">

      {/* Header */}
      <div className="bg-surface border-b border-surface-variant">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-outline">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
              <HiShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-outline">Orders</p>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
            </div>
          </div>

          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400">
              <HiCheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-outline">Completed</p>
              <p className="text-2xl font-bold text-white">
                {orders.filter(o => o.status === 'paid').length}
              </p>
            </div>
          </div>

          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
              <HiDownload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-outline">Downloads</p>
              <p className="text-2xl font-bold text-white">{purchasedProjects.length}</p>
            </div>
          </div>

          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-400">
              <HiHeart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-outline">Wishlist</p>
              <p className="text-2xl font-bold text-white">{wishlist.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-surface-variant">
            <nav className="flex gap-8 px-6">
              {['orders', 'downloads', 'wishlist'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-outline hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              orders.length === 0
                ? <EmptyState title="No orders yet" />
                : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-surface-variant rounded-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-shadow cursor-pointer"
                        onClick={() => setExpandedOrder(
                          expandedOrder === order.id ? null : order.id
                        )}
                      >
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={order.project_thumbnail || FALLBACK_IMG}
                              className="w-16 h-16 rounded-lg object-cover"
                              onError={(e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMG;
}}
                              alt={order.project_title}
                            />
                            <div>
                              <h3 className="font-medium text-white">
                                {order.project_title}
                              </h3>
                              <p className="text-sm text-outline">Order #{order.id}</p>
                              <p className="text-sm text-outline">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-white">
                              {formatPrice(order.amount)}
                            </p>
                            <div className="mt-1">{getStatusBadge(order.status)}</div>
                          </div>
                        </div>

                        {expandedOrder === order.id && (
                          <div className="border-t border-surface-variant bg-surface-high p-4 text-sm grid md:grid-cols-2 gap-4 fade-in">
                            <div>
                              <p>
                                <span className="text-outline">Payment ID: </span>
                                {order.razorpay_payment_id || 'N/A'}
                              </p>
                              <p>
                                <span className="text-outline">Category: </span>
                                {order.project_category}
                              </p>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/projects/${order.project_id}`}
                                className="btn btn-secondary btn-sm"
                              >
                                View Project
                              </Link>
                              {order.status === 'paid' && (
                                <button
                                  onClick={() => setActiveTab('downloads')}
                                  className="btn btn-primary btn-sm"
                                >
                                  Go to Downloads
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
            )}

            {/* DOWNLOADS TAB */}
            {activeTab === 'downloads' && (
              purchasedProjects.length === 0
                ? <EmptyState title="No downloads available" />
                : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {purchasedProjects.map((project) => (
                      <div
                        key={project.id}
                        className="card p-4 border border-surface-variant hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-shadow"
                      >
                        <div className="flex gap-4">
                          <img
                            src={project.thumbnail || FALLBACK_IMG}
                            className="w-20 h-20 rounded-lg object-cover"
                            onError={(e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMG;
}}
                            alt={project.title}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate">
                              {project.title}
                            </h3>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-outline">
                                <HiDownload className="w-4 h-4" />
                                <span>{project.downloads_remaining} downloads left</span>
                              </div>
                              <div className="flex items-center gap-2 text-outline">
                                <HiCalendar className="w-4 h-4" />
                                <span>Expires: {formatDate(project.expiry_date)}</span>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleDownload(project)}
                                disabled={
                                  downloadingId === project.id ||
                                  project.downloads_remaining <= 0
                                }
                                className="btn btn-primary btn-sm flex items-center gap-1"
                              >
                                {downloadingId === project.id
                                  ? 'Preparing...'
                                  : <><HiDownload /> Download</>
                                }
                              </button>
                              <Link
                                to={`/projects/${project.id}`}
                                className="btn btn-secondary btn-sm"
                              >
                                <HiExternalLink />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            )}

            {/* WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              wishlist.length === 0
                ? <EmptyState title="Your wishlist is empty" />
                : (
                  <div className="grid md:grid-cols-3 gap-6">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="card p-4 border border-surface-variant"
                      >
                        <img
                          src={item.thumbnail || FALLBACK_IMG}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                          onError={(e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMG;
}}
                          alt={item.title}
                        />
                        <h3 className="font-medium text-white text-sm mb-2 truncate">
                          {item.title}
                        </h3>
                        <p className="text-primary font-bold text-sm mb-3">
                          {formatINRFromPaise(item.price)}
                        </p>
                        <div className="flex gap-2">
                          <Link
                            to={`/projects/${item.id}`}
                            className="btn btn-primary btn-sm flex-1 text-center"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="btn btn-secondary btn-sm text-red-400"
                          >
                            <HiHeart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ title }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-surface-high rounded-full flex items-center justify-center mx-auto mb-4 text-outline">
      <HiExclamationCircle className="w-8 h-8" />
    </div>
    <h3 className="text-lg font-medium text-white">{title}</h3>
    <Link to="/projects" className="btn btn-primary mt-4 inline-block">
      Browse Projects
    </Link>
  </div>
);

export default Dashboard;
