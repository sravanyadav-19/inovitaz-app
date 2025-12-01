import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HiShoppingBag, 
  HiDownload, 
  HiClock, 
  HiCheckCircle,
  HiXCircle,
  HiExternalLink
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { ordersAPI } from '../api/payments';
import { projectsAPI } from '../api/projects';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [purchasedProjects, setPurchasedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, purchasedRes] = await Promise.all([
        ordersAPI.getMyOrders(),
        ordersAPI.getPurchased(),
      ]);

      if (ordersRes.success) {
        setOrders(ordersRes.data.orders);
      }
      if (purchasedRes.success) {
        setPurchasedProjects(purchasedRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (projectId) => {
    setDownloadingId(projectId);
    try {
        const response = await projectsAPI.getCategories();      if (response.success) {
        window.open(response.data.downloadUrl, '_blank');
        toast.success('Download started!');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: {
        icon: HiCheckCircle,
        text: 'Paid',
        className: 'bg-green-100 text-green-700',
      },
      pending: {
        icon: HiClock,
        text: 'Pending',
        className: 'bg-yellow-100 text-yellow-700',
      },
      failed: {
        icon: HiXCircle,
        text: 'Failed',
        className: 'bg-red-100 text-red-700',
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 fade-in">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-secondary-600">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <HiShoppingBag className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-600">Total Orders</p>
                <p className="text-2xl font-bold text-secondary-900">{orders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <HiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-600">Completed</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {orders.filter((o) => o.status === 'paid').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <HiDownload className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-600">Available Downloads</p>
                <p className="text-2xl font-bold text-secondary-900">{purchasedProjects.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-secondary-200">
            <nav className="flex gap-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'orders'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                Order History
              </button>
              <button
                onClick={() => setActiveTab('downloads')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'downloads'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                My Downloads
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'orders' && (
              <div>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <HiShoppingBag className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">
                      No orders yet
                    </h3>
                    <p className="text-secondary-600 mb-4">
                      Start exploring our projects and make your first purchase!
                    </p>
                    <Link to="/projects" className="btn btn-primary">
                      Browse Projects
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-secondary-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">
                            Project
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">
                            Date
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">
                            Amount
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={order.project_thumbnail || 'https://via.placeholder.com/48'}
                                  alt={order.project_title}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                                <div>
                                  <p className="font-medium text-secondary-900">
                                    {order.project_title}
                                  </p>
                                  <p className="text-sm text-secondary-500">
                                    {order.project_category}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-secondary-600">
                              {formatDate(order.created_at)}
                            </td>
                            <td className="py-4 px-4 font-medium text-secondary-900">
                              {formatPrice(order.amount)}
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="py-4 px-4">
                              <Link
                                to={`/projects/${order.project_id}`}
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center gap-1"
                              >
                                View <HiExternalLink className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'downloads' && (
              <div>
                {purchasedProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <HiDownload className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">
                      No downloads available
                    </h3>
                    <p className="text-secondary-600 mb-4">
                      Purchase a project to access downloads
                    </p>
                    <Link to="/projects" className="btn btn-primary">
                      Browse Projects
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {purchasedProjects.map((project) => (
                      <div key={project.id} className="card p-4 hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                          <img
                            src={project.thumbnail || 'https://via.placeholder.com/80'}
                            alt={project.title}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-secondary-900 truncate">
                              {project.title}
                            </h3>
                            <p className="text-sm text-secondary-500 mt-1">
                              Purchased {formatDate(project.purchased_at)}
                            </p>
                            <button
                              onClick={() => handleDownload(project.id)}
                              disabled={downloadingId === project.id}
                              className="mt-3 btn btn-primary btn-sm"
                            >
                              {downloadingId === project.id ? (
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  Preparing...
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <HiDownload className="w-4 h-4" />
                                  Download
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;