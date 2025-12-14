// src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import {
  HiViewGrid,
  HiCollection,
  HiShoppingCart,
  HiUsers,
  HiPlus,
  HiPencil,
  HiTrash,
  HiCurrencyRupee,
  HiTag,
  HiStar,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { adminProjectsAPI, projectsAPI } from "../api/projects";
import LoadingSpinner from "../components/LoadingSpinner";

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
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(Number(price || 0));

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Revenue</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">{formatPrice(stats?.totalRevenue || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><HiCurrencyRupee className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Orders</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">{stats?.totalOrders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><HiShoppingCart className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Users</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><HiUsers className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Projects</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">{stats?.totalProjects || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600"><HiCollection className="w-6 h-6" /></div>
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
                    <p className="text-sm text-secondary-500">{new Date(order.created_at).toLocaleDateString()}</p>
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

// ================== Admin Projects ==================
const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    thumbnail: "",
    content_url: "",
    category: "IoT",
    difficulty: "Beginner",
    overview: "",
    components: [], // { name, quantity, link }
    circuitImage: "",
    circuitText: "",
    steps: "",
    source: "",
    features: "",
    tech_stack: "",
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
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      price: "",
      thumbnail: "",
      content_url: "",
      category: "IoT",
      difficulty: "Beginner",
      overview: "",
      components: [],
      circuitImage: "",
      circuitText: "",
      steps: "",
      source: "",
      features: "",
      tech_stack: "",
    });
  };

  const handleCreate = () => {
    setEditingProject(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (project) => {
    let overview = "";
    let components = [];
    let circuitImage = "";
    let circuitText = "";
    let steps = "";
    let source = "";
    let featuresStr = "";
    let techStackStr = "";
    let jsonDownloadUrl = "";

    if (project.description) {
      try {
        const desc = JSON.parse(project.description);
        overview = desc.overview || "";
        jsonDownloadUrl = desc.download_url || "";
        
        if (Array.isArray(desc.components)) {
          components = desc.components.map(c => ({
            name: c.name || c,
            quantity: c.quantity || c.price || "1",
            link: c.link || ""
          }));
        } else if (typeof desc.components === "string") {
          components = desc.components.split("\n").map(line => line.trim()).filter(Boolean).map(line => ({ name: line, quantity: "1", link: "" }));
        }

        circuitImage = desc.circuit?.image || desc.circuitImage || "";
        circuitText = desc.circuit?.text || desc.circuitText || "";
        steps = desc.steps || "";
        source = desc.source || "";
        
        if(desc.features && Array.isArray(desc.features)) featuresStr = desc.features.join("\n");
        if(desc.tech_stack && Array.isArray(desc.tech_stack)) techStackStr = desc.tech_stack.join(", ");

      } catch {
        overview = project.description || "";
      }
    }

    if (!featuresStr && Array.isArray(project.features)) featuresStr = project.features.join("\n");
    if (!techStackStr && Array.isArray(project.tech_stack)) techStackStr = project.tech_stack.join(", ");

    setEditingProject(project);
    setFormData({
      title: project.title,
      price: project.price != null ? String(project.price) : "",
      thumbnail: project.thumbnail || "",
      content_url: project.content_url || jsonDownloadUrl || "", 
      category: project.category || "IoT",
      difficulty: project.difficulty || "Beginner",
      overview,
      components,
      circuitImage,
      circuitText,
      steps,
      source,
      features: featuresStr,
      tech_stack: techStackStr,
    });
    setShowModal(true);
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      const response = await adminProjectsAPI.delete(projectId);
      if (response.success) {
        toast.success("Project deleted successfully");
        fetchProjects();
      } else {
        toast.error(response.message || "Failed to delete project");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete project");
    }
  };

  const handleComponentChange = (index, field, value) => {
    const next = [...formData.components];
    next[index] = { ...next[index], [field]: field === "quantity" ? value.replace(/[^\d]/g, "") : value };
    setFormData((prev) => ({ ...prev, components: next }));
  };

  const handleAddComponentRow = () => {
    setFormData((prev) => ({ ...prev, components: [...prev.components, { name: "", quantity: "1", link: "" }] }));
  };

  const handleRemoveComponentRow = (index) => {
    const next = [...formData.components];
    next.splice(index, 1);
    setFormData((prev) => ({ ...prev, components: next }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const featuresArray = formData.features.split("\n").map((f) => f.trim()).filter(Boolean);
      const techStackArray = formData.tech_stack.split(",").map((t) => t.trim()).filter(Boolean);

      const descriptionJson = {
        overview: formData.overview,
        components: formData.components.map((c) => ({
          name: c.name?.trim() || "",
          quantity: c.quantity || "1",
          link: c.link?.trim() || "",
        })),
        circuit: { image: formData.circuitImage, text: formData.circuitText },
        steps: formData.steps,
        source: formData.source,
        download_url: formData.content_url, 
        features: featuresArray, 
        tech_stack: techStackArray 
      };

      const data = {
        title: formData.title,
        price: parseFloat(formData.price),
        thumbnail: formData.thumbnail,
        content_url: formData.content_url, 
        category: formData.category,
        difficulty: formData.difficulty,
        description: JSON.stringify(descriptionJson),
        features: featuresArray,
        tech_stack: techStackArray,
      };

      if (!data.title || Number.isNaN(data.price)) {
        toast.error("Title and valid price are required.");
        setSaving(false);
        return;
      }

      if (editingProject) {
        const res = await adminProjectsAPI.update(editingProject.id, data);
        if (res.success) toast.success("Project updated successfully");
        else toast.error(res.message || "Failed to update project");
      } else {
        const res = await adminProjectsAPI.create(data);
        if (res.success) toast.success("Project created successfully");
        else toast.error(res.message || "Failed to create project");
      }

      setShowModal(false);
      fetchProjects();
    } catch (error) {
      console.error("Save project error:", error);
      toast.error(error.response?.data?.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(Number(price || 0));

  const getShortDescription = (project) => {
    if (!project.description) return "";
    try {
      const d = JSON.parse(project.description);
      return d.overview || "";
    } catch {
      return project.description;
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-secondary-900">Manage Projects</h2>
        <button onClick={handleCreate} className="btn btn-primary"><HiPlus className="w-5 h-5 mr-2" /> Add Project</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Project</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Difficulty</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Rating</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Price</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img src={project.thumbnail || "https://via.placeholder.com/48"} alt={project.title} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium text-secondary-900">{project.title}</p>
                        <p className="text-sm text-secondary-500 truncate max-w-xs">{getShortDescription(project)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4"><span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{project.category}</span></td>
                  <td className="py-4 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${project.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' : project.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{project.difficulty || 'Beginner'}</span></td>
                  <td className="py-4 px-4"><div className="flex items-center gap-1"><HiStar className="w-4 h-4 text-yellow-400" /><span className="text-sm text-secondary-900">{project.average_rating ? Number(project.average_rating).toFixed(1) : '0.0'}</span><span className="text-xs text-secondary-500">({project.reviews_count || 0})</span></div></td>
                  <td className="py-4 px-4 font-medium text-secondary-900">{formatPrice(project.price)}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(project)} className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><HiPencil className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete(project.id)} className="p-2 text-secondary-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><HiTrash className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-secondary-500">No projects found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto fade-in">
              <div className="p-6 border-b border-secondary-200">
                <h3 className="text-xl font-semibold text-secondary-900">{editingProject ? "Edit Project" : "Add New Project"}</h3>
                <p className="text-sm text-secondary-500 mt-1">Add complete project information.</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4 bg-secondary-50 border border-secondary-200 rounded-xl p-4">
                  <h4 className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-secondary-500 mb-2">Project Info</h4>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-secondary-700 mb-1">Title *</label><input type="text" required value={formData.title} onChange={(e) => setFormData((prev) => ({...prev, title: e.target.value}))} className="input w-full" placeholder="Project title" /></div>
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Price (₹) *</label><input type="number" required min="0" step="0.01" value={formData.price} onChange={(e) => setFormData((prev) => ({...prev, price: e.target.value}))} className="input w-full" placeholder="499" /></div>
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Category</label><select value={formData.category} onChange={(e) => setFormData((prev) => ({...prev, category: e.target.value}))} className="input w-full"><option value="IoT">IoT</option><option value="Arduino">Arduino</option><option value="ESP32">ESP32</option><option value="Raspberry Pi">Raspberry Pi</option><option value="Robotics">Robotics</option><option value="Embedded">Embedded</option><option value="Automation">Automation</option></select></div>
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Difficulty</label><select value={formData.difficulty} onChange={(e) => setFormData((prev) => ({...prev, difficulty: e.target.value}))} className="input w-full"><option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option></select></div>
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Thumbnail URL</label><input type="url" value={formData.thumbnail} onChange={(e) => setFormData((prev) => ({...prev, thumbnail: e.target.value}))} className="input w-full" placeholder="https://example.com/image.jpg" /></div>
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Download URL (ZIP)</label><input type="url" value={formData.content_url} onChange={(e) => setFormData((prev) => ({...prev, content_url: e.target.value}))} className="input w-full" placeholder="https://example.com/download.zip" /></div>
                </div>

                <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary-500 mb-2">1. Overview</h4>
                  <textarea required rows={4} value={formData.overview} onChange={(e) => setFormData((prev) => ({...prev, overview: e.target.value}))} className="input w-full min-h-[160px] resize-y" placeholder="High-level summary of the project..." />
                </div>

                <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary-500">2. Components &amp; Quantity</h4>
                    <button type="button" onClick={handleAddComponentRow} className="text-xs font-medium text-primary-700 hover:text-primary-800">+ Add Component</button>
                  </div>
                  {formData.components.length > 0 && (
                    <div className="overflow-x-auto border border-secondary-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-white">
                          <tr><th className="text-left px-3 py-2 font-medium text-secondary-600">Component Name</th><th className="text-left px-3 py-2 font-medium text-secondary-600">Quantity</th><th className="text-left px-3 py-2 font-medium text-secondary-600">Link (URL)</th><th className="px-3 py-2"></th></tr>
                        </thead>
                        <tbody>
                          {formData.components.map((row, index) => (
                            <tr key={index} className="border-t border-secondary-100">
                              <td className="px-3 py-2"><input type="text" value={row.name} onChange={(e) => handleComponentChange(index, "name", e.target.value)} className="input w-full text-xs" placeholder="ESP32 Dev Board" /></td>
                              <td className="px-3 py-2"><input type="number" min="1" value={row.quantity} onChange={(e) => handleComponentChange(index, "quantity", e.target.value)} className="input w-full text-xs" placeholder="1" /></td>
                              <td className="px-3 py-2"><input type="url" value={row.link} onChange={(e) => handleComponentChange(index, "link", e.target.value)} className="input w-full text-xs" placeholder="https://shop.com/product" /></td>
                              <td className="px-3 py-2 text-right"><button type="button" onClick={() => handleRemoveComponentRow(index)} className="text-xs text-red-600 hover:text-red-700">Remove</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary-500 mb-2">3. Circuit Diagram</h4>
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Circuit Diagram Image URL</label><input type="url" value={formData.circuitImage} onChange={(e) => setFormData((prev) => ({...prev, circuitImage: e.target.value}))} className="input w-full" placeholder="https://your-domain.com/images/circuit.png" /></div>
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Circuit Explanation</label><textarea rows={4} value={formData.circuitText} onChange={(e) => setFormData((prev) => ({...prev, circuitText: e.target.value}))} className="input w-full min-h-[150px] resize-y" placeholder="Explain connections..." /></div>
                </div>

                <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary-500 mb-2">4. Step-by-Step Process</h4>
                  <textarea rows={8} value={formData.steps} onChange={(e) => setFormData((prev) => ({...prev, steps: e.target.value}))} className="input w-full min-h-[200px] resize-y" placeholder={"1. Install Arduino IDE...\n2. Add ESP32 board support..."} />
                </div>

                <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary-500 mb-2">5. Source Code &amp; Extra Notes</h4>
                  <textarea rows={5} value={formData.source} onChange={(e) => setFormData((prev) => ({...prev, source: e.target.value}))} className="input w-full min-h-[160px] resize-y" placeholder="Explain what is inside the ZIP..." />
                </div>

                <div className="grid md:grid-cols-2 gap-4 bg-secondary-50 border border-secondary-200 rounded-xl p-4">
                  <h4 className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-secondary-500 mb-2">Extras</h4>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-secondary-700 mb-1">Features (one per line)</label><textarea rows={3} value={formData.features} onChange={(e) => setFormData((prev) => ({...prev, features: e.target.value}))} className="input w-full min-h-[120px] resize-y" placeholder={"Feature 1\nFeature 2\nFeature 3"} /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-secondary-700 mb-1">Tech Stack (comma separated)</label><input type="text" value={formData.tech_stack} onChange={(e) => setFormData((prev) => ({...prev, tech_stack: e.target.value}))} className="input w-full" placeholder="ESP32, Arduino, HTML, CSS" /></div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" disabled={saving}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editingProject ? "Update" : "Create"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(Number(price || 0));

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

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
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Coupon</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-secondary-500">No orders found</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="py-4 px-4 font-mono text-sm text-secondary-600">#{order.id}</td>
                    <td className="py-4 px-4">
                      <div><p className="font-medium text-secondary-900">{order.user_name}</p><p className="text-sm text-secondary-500">{order.user_email}</p></div>
                    </td>
                    <td className="py-4 px-4 text-secondary-900">{order.project_title}</td>
                    <td className="py-4 px-4">
                      <div><p className="font-medium text-secondary-900">{formatPrice(order.amount)}</p>{order.discount_amount > 0 && <p className="text-xs text-green-600">-{formatPrice(order.discount_amount)} off</p>}</div>
                    </td>
                    <td className="py-4 px-4">{order.coupon_code ? <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{order.coupon_code}</span> : <span className="text-secondary-400 text-xs">-</span>}</td>
                    <td className="py-4 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "paid" ? "bg-green-100 text-green-700" : order.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{order.status}</span></td>
                    <td className="py-4 px-4 text-secondary-600">{new Date(order.created_at).toLocaleDateString()}</td>
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

// ================== Admin Users ==================
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
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-secondary-900 mb-6">All Users</h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr><th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">User</th><th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Email</th><th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Role</th><th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Joined</th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="py-4 px-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center"><span className="text-white font-medium">{user.name?.charAt(0).toUpperCase()}</span></div><span className="font-medium text-secondary-900">{user.name}</span></div></td>
                  <td className="py-4 px-4 text-secondary-600">{user.email}</td>
                  <td className="py-4 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-secondary-100 text-secondary-700"}`}>{user.role}</span></td>
                  <td className="py-4 px-4 text-secondary-600">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-secondary-500">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ================== Admin Coupons ==================
const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_purchase_amount: '', max_discount_amount: '', usage_limit: '', valid_until: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/coupons', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) setCoupons(data.data || []);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, discount_value: parseFloat(formData.discount_value), min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) * 100 : 0, max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) * 100 : null, usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Coupon created successfully');
        setShowModal(false);
        setFormData({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_purchase_amount: '', max_discount_amount: '', usage_limit: '', valid_until: '' });
        fetchCoupons();
      } else {
        toast.error(data.message || 'Failed to create coupon');
      }
    } catch (error) {
      toast.error('Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-secondary-900">Manage Coupons</h2>
        <button onClick={() => setShowModal(true)} className="btn btn-primary"><HiPlus className="w-5 h-5 mr-2" /> Add Coupon</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr><th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Code</th><th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Discount</th><th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Usage</th><th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Valid Until</th><th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Status</th></tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="py-4 px-4"><div><p className="font-mono font-medium text-secondary-900">{coupon.code}</p><p className="text-xs text-secondary-500">{coupon.description}</p></div></td>
                  <td className="py-4 px-4"><span className="text-secondary-900 font-medium">{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}</span></td>
                  <td className="py-4 px-4 text-secondary-600">{coupon.used_count} / {coupon.usage_limit || '∞'}</td>
                  <td className="py-4 px-4 text-secondary-600">{coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : 'No expiry'}</td>
                  <td className="py-4 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{coupon.is_active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-secondary-500">No coupons found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full fade-in">
              <div className="p-6 border-b border-secondary-200">
                <h3 className="text-xl font-semibold text-secondary-900">Create Coupon</h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="block text-sm font-medium text-secondary-700 mb-1">Code *</label><input type="text" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="input w-full" placeholder="SAVE20" /></div>
                <div><label className="block text-sm font-medium text-secondary-700 mb-1">Description</label><input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input w-full" placeholder="20% off for new users" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Type *</label><select value={formData.discount_type} onChange={(e) => setFormData({...formData, discount_type: e.target.value})} className="input w-full"><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></select></div>
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Value *</label><input type="number" required value={formData.discount_value} onChange={(e) => setFormData({...formData, discount_value: e.target.value})} className="input w-full" placeholder={formData.discount_type === 'percentage' ? '20' : '100'} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Min Purchase (₹)</label><input type="number" value={formData.min_purchase_amount} onChange={(e) => setFormData({...formData, min_purchase_amount: e.target.value})} className="input w-full" placeholder="0" /></div>
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Max Discount (₹)</label><input type="number" value={formData.max_discount_amount} onChange={(e) => setFormData({...formData, max_discount_amount: e.target.value})} className="input w-full" placeholder="No limit" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Usage Limit</label><input type="number" value={formData.usage_limit} onChange={(e) => setFormData({...formData, usage_limit: e.target.value})} className="input w-full" placeholder="Unlimited" /></div>
                  <div><label className="block text-sm font-medium text-secondary-700 mb-1">Valid Until</label><input type="date" value={formData.valid_until} onChange={(e) => setFormData({...formData, valid_until: e.target.value})} className="input w-full" /></div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Coupon'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================== Main Admin Dashboard ==================
const AdminDashboard = () => {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? "bg-primary-100 text-primary-700 font-medium"
        : "text-secondary-600 hover:bg-secondary-100"
    }`;

  return (
    <div className="min-h-screen bg-secondary-50 fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <div className="card p-4 sticky top-24">
              <h2 className="text-lg font-semibold text-secondary-900 px-4 py-2 mb-2">Admin Panel</h2>
              <nav className="space-y-1">
                <NavLink to="/admin" end className={navLinkClass}><HiViewGrid className="w-5 h-5" /> Dashboard</NavLink>
                <NavLink to="/admin/projects" className={navLinkClass}><HiCollection className="w-5 h-5" /> Projects</NavLink>
                <NavLink to="/admin/orders" className={navLinkClass}><HiShoppingCart className="w-5 h-5" /> Orders</NavLink>
                <NavLink to="/admin/users" className={navLinkClass}><HiUsers className="w-5 h-5" /> Users</NavLink>
                <NavLink to="/admin/coupons" className={navLinkClass}><HiTag className="w-5 h-5" /> Coupons</NavLink>
              </nav>
            </div>
          </div>
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