/**
 * AdminCoupons — coupon table + create/toggle/delete modal
 * (extracted from AdminDashboard; logic untouched).
 */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { HiPlus, HiX, HiTrash, HiCheck, HiXCircle } from "react-icons/hi";
import { adminProjectsAPI } from "../../api/projects";
import { formatINRFromPaise, rupeesToPaise } from "../../utils/price";
import AdminSkeleton from "./AdminSkeleton";

const formatPaiseToINR = formatINRFromPaise;

// ================== Admin Coupons ==================
const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    valid_until: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await adminProjectsAPI.getAllCoupons();
      if (response.success) {
        setCoupons(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_purchase_amount: "",
      max_discount_amount: "",
      usage_limit: "",
      valid_until: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value:
          formData.discount_type === "fixed"
            ? rupeesToPaise(formData.discount_value)
            : parseFloat(formData.discount_value),
        min_purchase_amount: formData.min_purchase_amount
          ? parseFloat(formData.min_purchase_amount) * 100
          : 0,
        max_discount_amount: formData.max_discount_amount
          ? parseFloat(formData.max_discount_amount) * 100
          : null,
        usage_limit: formData.usage_limit
          ? parseInt(formData.usage_limit)
          : null,
        valid_until: formData.valid_until || null,
      };

      const response = await adminProjectsAPI.createCoupon(payload);

      if (response.success) {
        toast.success("Coupon created successfully");
        setShowModal(false);
        resetForm();
        fetchCoupons();
      } else {
        toast.error(response.message || "Failed to create coupon");
      }
    } catch (error) {
      toast.error(error.message || "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (couponId) => {
    try {
      const response = await adminProjectsAPI.toggleCoupon(couponId);
      if (response.success) {
        toast.success("Coupon status updated");
        fetchCoupons();
      } else {
        toast.error(response.message || "Failed to update coupon");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update coupon");
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const response = await adminProjectsAPI.deleteCoupon(couponId);
      if (response.success) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
      } else {
        toast.error(response.message || "Failed to delete coupon");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete coupon");
    }
  };

  const formatPrice = formatPaiseToINR;

  if (loading) {
    return <AdminSkeleton type="table" rows={6} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="t-h3 text-white">
          Manage Coupons
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <HiPlus className="w-5 h-5 mr-2" /> Add Coupon
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Code
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Discount
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Min Purchase
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Usage
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Valid Until
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Status
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className="border-b border-surface-variant hover:bg-surface"
                >
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-mono font-medium text-white">
                        {coupon.code}
                      </p>
                      <p className="text-xs text-outline">
                        {coupon.description}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="t-num text-white">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value)}
                    </span>
                    {coupon.max_discount_amount && (
                      <p className="text-xs text-outline">
                        Max: {formatPrice(coupon.max_discount_amount)}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-4 text-outline">
                    {coupon.min_purchase_amount
                      ? formatPrice(coupon.min_purchase_amount)
                      : "-"}
                  </td>
                  <td className="py-4 px-4 text-outline">
                    {coupon.used_count} / {coupon.usage_limit || "∞"}
                  </td>
                  <td className="py-4 px-4 text-outline">
                    {coupon.valid_until
                      ? new Date(coupon.valid_until).toLocaleDateString()
                      : "No expiry"}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`badge ${coupon.is_active ? "badge-success" : "badge-danger"}`}
                    >
                      {coupon.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(coupon.id)}
                        aria-label={`${coupon.is_active ? 'Deactivate' : 'Activate'} coupon ${coupon.code}`}
                        className={`p-2 rounded-lg transition-colors ${
                          coupon.is_active
                            ? "text-danger-fg hover:bg-danger/10"
                            : "text-success-fg hover:bg-success/10"
                        }`}
                        title={coupon.is_active ? "Deactivate" : "Activate"}
                      >
                        {coupon.is_active ? (
                          <HiXCircle aria-hidden="true" className="w-5 h-5" />
                        ) : (
                          <HiCheck aria-hidden="true" className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon.id)}
                        aria-label={`Delete coupon ${coupon.code}`}
                        className="p-2 text-outline hover:text-danger-fg hover:bg-danger/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <HiTrash aria-hidden="true" className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-outline"
                  >
                    No coupons found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
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
              aria-labelledby="coupon-modal-title"
              tabIndex={-1}
              onKeyDown={(event) => event.key === 'Escape' && setShowModal(false)}
              className="relative bg-surface-lowest border border-surface-variant rounded-2xl max-w-md w-full fade-in"
            >
              <button
                type="button"
                autoFocus
                onClick={() => setShowModal(false)}
                aria-label="Close coupon form"
                className="absolute right-4 top-4 p-2 text-outline hover:text-white rounded-lg"
              >
                <HiX aria-hidden="true" className="w-5 h-5" />
              </button>
              <div className="p-6 border-b border-surface-variant">
                <h3 id="coupon-modal-title" className="t-h3 text-white">
                  Create Coupon
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-outline mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="input w-full"
                    placeholder="SAVE20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-outline mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input w-full"
                    placeholder="20% off for new users"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Type *
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount_type: e.target.value,
                        })
                      }
                      className="input w-full"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Value *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount_value: e.target.value,
                        })
                      }
                      className="input w-full"
                      placeholder={
                        formData.discount_type === "percentage" ? "20" : "100"
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Min Purchase (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.min_purchase_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_purchase_amount: e.target.value,
                        })
                      }
                      className="input w-full"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Max Discount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_discount_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_discount_amount: e.target.value,
                        })
                      }
                      className="input w-full"
                      placeholder="No limit"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usage_limit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usage_limit: e.target.value,
                        })
                      }
                      className="input w-full"
                      placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-outline mb-1">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valid_until: e.target.value,
                        })
                      }
                      className="input w-full"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
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
                    {saving ? "Creating..." : "Create Coupon"}
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


export default AdminCoupons;
