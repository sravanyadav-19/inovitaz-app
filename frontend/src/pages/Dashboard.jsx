import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HiShoppingBag, 
  HiDownload, 
  HiCheckCircle,
  HiExternalLink,
  HiHeart,
  HiRefresh,
  HiExclamationCircle,
  HiCalendar,
  HiLockClosed,
  HiXCircle
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
  
  const [wishlist, setWishlist] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);

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

      // --- FIX: Safe Array Check for Orders ---
      if (ordersRes?.success && Array.isArray(ordersRes.data?.orders)) {
        setOrders(ordersRes.data.orders);
      } else {
        setOrders([]);
      }

      // --- FIX: Safe Array Check for Downloads ---
      const downloadsData = purchasedRes?.data?.downloads;
      
      if (purchasedRes?.success && Array.isArray(downloadsData)) {
        const enhancedProjects = downloadsData.map(project => ({
          ...project,
          downloads_remaining: project.downloads_remaining ?? 5,
          total_downloads: project.total_downloads ?? 5,
          expiry_date: project.expiry_date || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          last_downloaded: project.last_downloaded || null
        }));
        setPurchasedProjects(enhancedProjects);
      } else {
        setPurchasedProjects([]);
      }
      
      // Wishlist from LocalStorage
      try {
        const wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlist(wishlistIds.map(id => ({ id })));
      } catch (error) {
        console.log('Wishlist error');
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
        
        // Update local state
        setPurchasedProjects(prev => prev.map(p => 
          p.id === project.id 
            ? { ...p, downloads_remaining: p.downloads_remaining - 1, last_downloaded: new Date().toISOString() }
            : p
        ));
      }
    } catch (error) {
      toast.error('Download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  const removeFromWishlist = async (projectId) => {
    try {
      await projectsAPI.removeFromWishlist?.(projectId);
      setWishlist(prev => prev.filter(item => item.id !== projectId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove');
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: { className: 'bg-green-100 text-green-700', text: 'Paid' },
      pending: { className: 'bg-yellow-100 text-yellow-700', text: 'Pending' },
      failed: { className: 'bg-red-100 text-red-700', text: 'Failed' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 fade-in">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Welcome back, {user?.name}!</h1>
              <p className="text-secondary-600">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600"><HiShoppingBag className="w-6 h-6" /></div>
            <div><p className="text-sm text-secondary-600">Orders</p><p className="text-2xl font-bold">{orders.length}</p></div>
          </div>
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><HiCheckCircle className="w-6 h-6" /></div>
            <div><p className="text-sm text-secondary-600">Completed</p><p className="text-2xl font-bold">{orders.filter(o => o.status === 'paid').length}</p></div>
          </div>
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><HiDownload className="w-6 h-6" /></div>
            <div><p className="text-sm text-secondary-600">Downloads</p><p className="text-2xl font-bold">{purchasedProjects.length}</p></div>
          </div>
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600"><HiHeart className="w-6 h-6" /></div>
            <div><p className="text-sm text-secondary-600">Wishlist</p><p className="text-2xl font-bold">{wishlist.length}</p></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-secondary-200">
            <nav className="flex gap-8 px-6">
              {['orders', 'downloads', 'wishlist'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-secondary-500 hover:text-secondary-800'}`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              orders.length === 0 ? <EmptyState title="No orders yet" /> : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-secondary-200 rounded-lg hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img src={order.project_thumbnail || 'https://via.placeholder.com/64'} className="w-16 h-16 rounded-lg object-cover" />
                          <div>
                            <h3 className="font-medium text-secondary-900">{order.project_title}</h3>
                            <p className="text-sm text-secondary-500">Order #{order.id}</p>
                            <p className="text-sm text-secondary-500">{formatDate(order.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-secondary-900">{formatPrice(order.amount)}</p>
                          <div className="mt-1">{getStatusBadge(order.status)}</div>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {expandedOrder === order.id && (
                        <div className="border-t border-secondary-200 bg-secondary-50 p-4 text-sm grid md:grid-cols-2 gap-4 fade-in">
                          <div>
                            <p><span className="text-secondary-600">Payment ID:</span> {order.razorpay_payment_id || 'N/A'}</p>
                            <p><span className="text-secondary-600">Category:</span> {order.project_category}</p>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Link to={`/projects/${order.project_id}`} className="btn btn-secondary btn-sm">View Project</Link>
                            {order.status === 'paid' && <button onClick={() => setActiveTab('downloads')} className="btn btn-primary btn-sm">Go to Downloads</button>}
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
              purchasedProjects.length === 0 ? <EmptyState title="No downloads available" /> : (
                <div className="grid md:grid-cols-2 gap-4">
                  {purchasedProjects.map((project) => (
                    <div key={project.id} className="card p-4 border border-secondary-200 hover:shadow-md transition-shadow">
                      <div className="flex gap-4">
                        <img src={project.thumbnail || 'https://via.placeholder.com/80'} className="w-20 h-20 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-secondary-900 truncate">{project.title}</h3>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-secondary-600">
                              <HiDownload className="w-4 h-4" />
                              <span>{project.downloads_remaining} downloads left</span>
                            </div>
                            <div className="flex items-center gap-2 text-secondary-600">
                              <HiCalendar className="w-4 h-4" />
                              <span>Expires: {formatDate(project.expiry_date)}</span>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button 
                              onClick={() => handleDownload(project)}
                              disabled={downloadingId === project.id || project.downloads_remaining <= 0}
                              className="btn btn-primary btn-sm flex items-center gap-1"
                            >
                              {downloadingId === project.id ? "Preparing..." : <><HiDownload /> Download</>}
                            </button>
                            <Link to={`/projects/${project.id}`} className="btn btn-secondary btn-sm"><HiExternalLink /></Link>
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
              wishlist.length === 0 ? <EmptyState title="Your wishlist is empty" /> : (
                <div className="grid md:grid-cols-3 gap-6">
                  {wishlist.map((item) => (
                    <div key={item.id} className="card p-4 text-center border border-secondary-200">
                      <div className="w-full h-32 bg-secondary-100 rounded-lg mb-3 flex items-center justify-center text-secondary-400">
                        <HiHeart className="w-8 h-8" />
                      </div>
                      <Link to={`/projects/${item.id}`} className="btn btn-primary btn-sm w-full">View Project</Link>
                      <button onClick={() => removeFromWishlist(item.id)} className="text-red-500 text-sm mt-2 hover:underline">Remove</button>
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
    <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary-400">
      <HiExclamationCircle className="w-8 h-8" />
    </div>
    <h3 className="text-lg font-medium text-secondary-900">{title}</h3>
    <Link to="/projects" className="btn btn-primary mt-4 inline-block">Browse Projects</Link>
  </div>
);

export default Dashboard;