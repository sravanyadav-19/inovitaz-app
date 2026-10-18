/**
 * AdminProjects — catalog table + create/edit project modal
 * (extracted from AdminDashboard; logic untouched).
 */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { HiPlus, HiPencil, HiTrash, HiStar, HiX } from "react-icons/hi";
import { adminProjectsAPI, projectsAPI } from "../../api/projects";
import { formatINRFromPaise, rupeesToPaise, paiseToRupees } from "../../utils/price";
import AdminSkeleton from "./AdminSkeleton";

const formatPaiseToINR = formatINRFromPaise;

const ADMIN_PROJECT_FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <rect width="48" height="48" rx="10" fill="#0c1324"/>
      <rect x="9" y="9" width="30" height="30" rx="6" fill="#151b2d" stroke="#3b82f6" stroke-width="2"/>
      <path d="M18 24h12M24 18v12" stroke="#4ae176" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `);

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
    components: [],
    circuitImage: "",
    circuitText: "",
    steps: "",
    source: "",
    features: "",
    tech_stack: "",
    status: 'active',
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
      status: 'active',
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
          components = desc.components.map((c) => ({
            name: c.name || c,
            quantity: c.quantity || c.price || "1",
            link: c.link || "",
          }));
        } else if (typeof desc.components === "string") {
          components = desc.components
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => ({ name: line, quantity: "1", link: "" }));
        }

        circuitImage = desc.circuit?.image || desc.circuitImage || "";
        circuitText = desc.circuit?.text || desc.circuitText || "";
        steps = desc.steps || "";
        source = desc.source || "";

        if (desc.features && Array.isArray(desc.features))
          featuresStr = desc.features.join("\n");
        if (desc.tech_stack && Array.isArray(desc.tech_stack))
          techStackStr = desc.tech_stack.join(", ");
      } catch {
        overview = project.description || "";
      }
    }

    if (!featuresStr && Array.isArray(project.features))
      featuresStr = project.features.join("\n");
    if (!techStackStr && Array.isArray(project.tech_stack))
      techStackStr = project.tech_stack.join(", ");

    setEditingProject(project);
    setFormData({
      title: project.title,
      price: project.price != null ? String(paiseToRupees(project.price)) : "",
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
      status: ['active', 'maintenance', 'closed'].includes(project.status) ? project.status : 'active',
    });
    setShowModal(true);
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;
    try {
      const response = await adminProjectsAPI.delete(projectId);
      if (response.success) {
        toast.success("Project deleted successfully");
        fetchProjects();
      } else {
        toast.error(response.message || "Failed to delete project");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete project");
    }
  };

  const handleComponentChange = (index, field, value) => {
    const next = [...formData.components];
    next[index] = {
      ...next[index],
      [field]: field === "quantity" ? value.replace(/[^\d]/g, "") : value,
    };
    setFormData((prev) => ({ ...prev, components: next }));
  };

  const handleAddComponentRow = () => {
    setFormData((prev) => ({
      ...prev,
      components: [...prev.components, { name: "", quantity: "1", link: "" }],
    }));
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
      const featuresArray = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
      const techStackArray = formData.tech_stack
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

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
        tech_stack: techStackArray,
      };

      const data = {
        title: formData.title,
        price: rupeesToPaise(formData.price),
        thumbnail: formData.thumbnail,
        content_url: formData.content_url,
        category: formData.category,
        difficulty: formData.difficulty,
        status: formData.status,
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
      toast.error(error.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = formatPaiseToINR;

  const getShortDescription = (project) => {
    if (!project.description) return "";
    try {
      const d = JSON.parse(project.description);
      return d.overview || "";
    } catch {
      return project.description;
    }
  };

  if (loading) {
    return <AdminSkeleton type="table" rows={6} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="t-h3 text-white">
          Manage Projects
        </h2>
        <button onClick={handleCreate} className="btn btn-primary">
          <HiPlus className="w-5 h-5 mr-2" /> Add Project
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Project
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Category
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Difficulty
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Rating
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Price
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-surface-variant hover:bg-surface"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={project.thumbnail || ADMIN_PROJECT_FALLBACK_IMAGE}
                        alt={project.title}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = ADMIN_PROJECT_FALLBACK_IMAGE;
                        }}
                      />
                      <div>
                        <p className="font-medium text-white">
                          {project.title}
                        </p>
                        <p className="text-sm text-outline truncate max-w-xs">
                          {getShortDescription(project)}
                        </p>
                        {project.status === 'maintenance' && (
                          <span className="badge badge-primary mt-1">Under maintenance</span>
                        )}
                        {project.status === 'closed' && (
                          <span className="badge badge-danger mt-1">Temporarily closed</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="badge badge-primary">
                      {project.category}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`badge ${
                        project.difficulty === "Beginner"
                          ? "badge-success"
                          : project.difficulty === "Intermediate"
                          ? "badge-warning"
                          : "badge-danger"
                      }`}
                    >
                      {project.difficulty || "Beginner"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      <HiStar className="w-4 h-4 text-warning-fg" />
                      <span className="text-sm text-white">
                        {project.average_rating
                          ? Number(project.average_rating).toFixed(1)
                          : "0.0"}
                      </span>
                      <span className="text-xs text-outline">
                        ({project.reviews_count || 0})
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 t-num text-white">
                    {formatPrice(project.price)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(project)}
                        aria-label={`Edit ${project.title}`}
                        className="p-2 text-outline hover:text-primary-dim hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <HiPencil aria-hidden="true" className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(project.id)}
                        aria-label={`Delete ${project.title}`}
                        className="p-2 text-outline hover:text-danger-fg hover:bg-danger/10 rounded-lg transition-colors"
                      >
                        <HiTrash aria-hidden="true" className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-outline"
                  >
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/80 fade-in"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex min-h-full items-center justify-center p-4">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-modal-title"
              tabIndex={-1}
              onKeyDown={(event) => event.key === 'Escape' && setShowModal(false)}
              className="relative bg-surface-lowest border border-surface-variant rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto fade-in"
            >
              <button
                type="button"
                autoFocus
                onClick={() => setShowModal(false)}
                aria-label="Close project form"
                className="absolute right-4 top-4 p-2 text-outline hover:text-white rounded-lg"
              >
                <HiX aria-hidden="true" className="w-5 h-5" />
              </button>
              <div className="p-6 border-b border-surface-variant">
                <h3 id="project-modal-title" className="t-h3 text-white">
                  {editingProject ? "Edit Project" : "Add New Project"}
                </h3>
                <p className="text-sm text-outline mt-1">
                  Add complete project information.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-4 bg-surface border border-surface-variant rounded-xl p-4">
                  <h4 className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-outline mb-2">
                    Project Info
                  </h4>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-outline mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="input w-full"
                      placeholder="Project title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      className="input w-full"
                      placeholder="499"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="input w-full"
                    >
                      <option value="IoT">IoT</option>
                      <option value="Arduino">Arduino</option>
                      <option value="ESP32">ESP32</option>
                      <option value="Raspberry Pi">Raspberry Pi</option>
                      <option value="Robotics">Robotics</option>
                      <option value="Embedded">Embedded</option>
                      <option value="Automation">Automation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Difficulty
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          difficulty: e.target.value,
                        }))
                      }
                      className="input w-full"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Thumbnail URL
                    </label>
                    <input
                      type="url"
                      value={formData.thumbnail}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          thumbnail: e.target.value,
                        }))
                      }
                      className="input w-full"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Download URL (ZIP)
                    </label>
                    <input
                      type="url"
                      value={formData.content_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          content_url: e.target.value,
                        }))
                      }
                      className="input w-full"
                      placeholder="https://example.com/download.zip"
                    />
                  </div>

                  {/* Project status — admin-only 3-state control (stamp shows on the public page) */}
                  <div className="md:col-span-2">
                    <label className="block t-label text-outline mb-2">Project status</label>
                    <div
                      role="group"
                      aria-label="Project status"
                      className="grid grid-cols-3 gap-0 rounded-xl border border-surface-variant overflow-hidden"
                    >
                      {[
                        { value: 'active',      label: 'Active',      desc: 'sells + downloads', sel: 'bg-success/15 text-success-fg border-success/40' },
                        { value: 'maintenance', label: 'Under Maintenance', desc: 'sales paused', sel: 'bg-info/15 text-info-fg border-info/40' },
                        { value: 'closed',      label: 'Temporarily Closed', desc: 'all paused',  sel: 'bg-danger/15 text-danger-fg border-danger/40' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={formData.status === opt.value}
                          onClick={() => setFormData((prev) => ({ ...prev, status: opt.value }))}
                          className={`min-h-11 py-3 px-2 text-center border-r border-surface-variant last:border-r-0 transition-colors ${
                            formData.status === opt.value
                              ? `${opt.sel} border-y font-semibold`
                              : 'text-outline hover:text-white hover:bg-surface-high'
                          }`}
                        >
                          <span className="block text-sm font-medium">{opt.label}</span>
                          <span className="block t-caption">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Overview */}
                <div className="bg-surface border border-surface-variant rounded-xl p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-outline mb-2">
                    1. Overview
                  </h4>
                  <textarea
                    required
                    rows={4}
                    value={formData.overview}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        overview: e.target.value,
                      }))
                    }
                    className="input w-full min-h-[160px] resize-y"
                    placeholder="High-level summary of the project..."
                  />
                </div>

                {/* Components */}
                <div className="bg-surface border border-surface-variant rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-outline">
                      2. Components & Quantity
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddComponentRow}
                      className="text-xs font-medium text-primary-dim hover:text-primary-fixed"
                    >
                      + Add Component
                    </button>
                  </div>
                  {formData.components.length > 0 && (
                    <div className="overflow-x-auto border border-surface-variant rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-surface-lowest">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-outline">
                              Component Name
                            </th>
                            <th className="text-left px-3 py-2 font-medium text-outline">
                              Quantity
                            </th>
                            <th className="text-left px-3 py-2 font-medium text-outline">
                              Link (URL)
                            </th>
                            <th className="px-3 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.components.map((row, index) => (
                            <tr
                              key={index}
                              className="border-t border-surface-variant"
                            >
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={row.name}
                                  onChange={(e) =>
                                    handleComponentChange(
                                      index,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="input w-full text-xs"
                                  placeholder="ESP32 Dev Board"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={row.quantity}
                                  onChange={(e) =>
                                    handleComponentChange(
                                      index,
                                      "quantity",
                                      e.target.value
                                    )
                                  }
                                  className="input w-full text-xs"
                                  placeholder="1"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="url"
                                  value={row.link}
                                  onChange={(e) =>
                                    handleComponentChange(
                                      index,
                                      "link",
                                      e.target.value
                                    )
                                  }
                                  className="input w-full text-xs"
                                  placeholder="https://shop.com/product"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveComponentRow(index)}
                                  className="text-xs text-danger-fg hover:text-danger"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Circuit Diagram */}
                <div className="bg-surface border border-surface-variant rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-outline mb-2">
                    3. Circuit Diagram
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Circuit Diagram Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.circuitImage}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          circuitImage: e.target.value,
                        }))
                      }
                      className="input w-full"
                      placeholder="https://your-domain.com/images/circuit.png"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Circuit Explanation
                    </label>
                    <textarea
                      rows={4}
                      value={formData.circuitText}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          circuitText: e.target.value,
                        }))
                      }
                      className="input w-full min-h-[150px] resize-y"
                      placeholder="Explain connections..."
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="bg-surface border border-surface-variant rounded-xl p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-outline mb-2">
                    4. Step-by-Step Process
                  </h4>
                  <textarea
                    rows={8}
                    value={formData.steps}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        steps: e.target.value,
                      }))
                    }
                    className="input w-full min-h-[200px] resize-y"
                    placeholder={"1. Install Arduino IDE...\n2. Add ESP32 board support..."}
                  />
                </div>

                {/* Source Code */}
                <div className="bg-surface border border-surface-variant rounded-xl p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-outline mb-2">
                    5. Source Code & Extra Notes
                  </h4>
                  <textarea
                    rows={5}
                    value={formData.source}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        source: e.target.value,
                      }))
                    }
                    className="input w-full min-h-[160px] resize-y"
                    placeholder="Explain what is inside the ZIP..."
                  />
                </div>

                {/* Extras */}
                <div className="grid md:grid-cols-2 gap-4 bg-surface border border-surface-variant rounded-xl p-4">
                  <h4 className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-outline mb-2">
                    Extras
                  </h4>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-outline mb-1">
                      Features (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.features}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          features: e.target.value,
                        }))
                      }
                      className="input w-full min-h-[120px] resize-y"
                      placeholder={"Feature 1\nFeature 2\nFeature 3"}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-outline mb-1">
                      Tech Stack (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tech_stack}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tech_stack: e.target.value,
                        }))
                      }
                      className="input w-full"
                      placeholder="ESP32, Arduino, HTML, CSS"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-surface-variant">
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
                    {saving
                      ? "Saving..."
                      : editingProject
                      ? "Update"
                      : "Create"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};


export default AdminProjects;
