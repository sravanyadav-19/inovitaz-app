import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  HiViewGrid,
  HiCollection,
  HiShoppingCart,
  HiUsers,
  HiPlus,
  HiPencil,
  HiTrash,
  HiCurrencyRupee,
  HiTrendingUp,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { adminProjectsAPI, projectsAPI } from '../api/projects';
import LoadingSpinner from '../components/LoadingSpinner';

// Admin Stats Component
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
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Revenue</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {formatPrice(stats?.totalRevenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <HiCurrencyRupee className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Orders</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {stats?.totalOrders || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <HiShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Users</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <HiUsers className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Projects</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {stats?.totalProjects || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <HiCollection className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="p-6 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">Recent Orders</h2>
        </div>
        <div className="p-6">
          {stats?.recentOrders?.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0">
                  <div>
                    <p className="font-medium text-secondary-900">{order.project_title}</p>
                    <p className="text-sm text-secondary-500">{order.user_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-secondary-900">{formatPrice(order.amount)}</p>
                    <p className="text-sm text-secondary-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-500 text-center py-4">No recent orders</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Projects Management Component
const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    thumbnail: '',
    content_url: '',
    category: 'IoT',
    features: '',
    tech_stack: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll({ limit: 100 });
      if (response.success) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      thumbnail: '',
      content_url: '',
      category: 'IoT',
      features: '',
      tech_stack: '',
    });
    setShowModal(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      price: project.price.toString(),
      thumbnail: project.thumbnail || '',
      content_url: project.content_url || '',
      category: project.category || 'IoT',
      features: Array.isArray(project.features) ? project.features.join('\n') : '',
      tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack.join(', ') : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await adminProjectsAPI.delete(projectId);
      if (response.success) {
        toast.success('Project deleted successfully');
        fetchProjects();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        features: formData.features.split('\n').filter(f => f.trim()),
        tech_stack: formData.tech_stack.split(',').map(t => t.trim()).filter(t => t),
      };

      if (editingProject) {
        await adminProjectsAPI.update(editingProject.id, data);
        toast.success('Project updated successfully');
      } else {
        await adminProjectsAPI.create(data);
        toast.success('Project created successfully');
      }

      setShowModal(false);
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-secondary-900">Manage Projects</h2>
        <button onClick={handleCreate} className="btn btn-primary">
          <HiPlus className="w-5 h-5 mr-2" />
          Add Project
        </button>
      </div>

      {/* Projects Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Project</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Price</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={project.thumbnail || 'https://via.placeholder.com/48'}
                        alt={project.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-secondary-900">{project.title}</p>
                        <p className="text-sm text-secondary-500 truncate max-w-xs">
                          {project.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                      {project.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-secondary-900">
                    {formatPrice(project.price)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <HiPencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-2 text-secondary-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto fade-in">
              <div className="p-6 border-b border-secondary-200">
                <h3 className="text-xl font-semibold text-secondary-900">
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input"
                      placeholder="Project title"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input"
                      placeholder="Project description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input"
                      placeholder="999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input"
                    >
                      <option value="IoT">IoT</option>
                      <option value="Embedded">Embedded</option>
                      <option value="Automation">Automation</option>
                      <option value="Robotics">Robotics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Thumbnail URL
                    </label>
                    <input
                      type="url"
                      value={formData.thumbnail}
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                      className="input"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Download URL
                    </label>
                    <input
                      type="url"
                      value={formData.content_url}
                      onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                      className="input"
                      placeholder="https://example.com/download.zip"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Features (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      className="input"
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Tech Stack (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tech_stack}
                      onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                      className="input"
                      placeholder="ESP32, Arduino, React, Node.js"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingProject ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Orders Management Component
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
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-secondary-900 mb-6">All Orders</h2>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Project</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-secondary-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="py-4 px-4 font-mono text-sm text-secondary-600">
                      #{order.id}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-secondary-900">{order.user_name}</p>
                        <p className="text-sm text-secondary-500">{order.user_email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-secondary-900">
                      {order.project_title}
                    </td>
                    <td className="py-4 px-4 font-medium text-secondary-900">
                      {formatPrice(order.amount)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-secondary-600">
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

// Users Management Component
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminProjectsAPI.getAllUsers();
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-secondary-900 mb-6">All Users</h2>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-secondary-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-secondary-600">{user.email}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-secondary-100 text-secondary-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-secondary-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-100 text-primary-700 font-medium'
        : 'text-secondary-600 hover:bg-secondary-100'
    }`;

  return (
    <div className="min-h-screen bg-secondary-50 fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="card p-4 sticky top-24">
              <h2 className="text-lg font-semibold text-secondary-900 px-4 py-2 mb-2">
                Admin Panel
              </h2>
              <nav className="space-y-1">
                <NavLink to="/admin" end className={navLinkClass}>
                  <HiViewGrid className="w-5 h-5" />
                  Dashboard
                </NavLink>
                <NavLink to="/admin/projects" className={navLinkClass}>
                  <HiCollection className="w-5 h-5" />
                  Projects
                </NavLink>
                <NavLink to="/admin/orders" className={navLinkClass}>
                  <HiShoppingCart className="w-5 h-5" />
                  Orders
                </NavLink>
                <NavLink to="/admin/users" className={navLinkClass}>
                  <HiUsers className="w-5 h-5" />
                  Users
                </NavLink>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Routes>
              <Route index element={<AdminStats />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;