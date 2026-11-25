import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineArrowLeft, HiOutlineLocationMarker, HiOutlineCalendar } from "react-icons/hi";
import { projectsAPI } from "../api/projects";
import { completeOrdersAPI } from "../api/completeOrders";
import { AuthContext } from "../context/AuthContext";
import { formatINRFromPaise } from "../utils/price";

const inputClass =
  "w-full bg-surface border border-surface-variant rounded-xl px-4 py-3 text-white placeholder-outline focus:outline-none focus:border-primary min-h-11";

const BUILD_DAYS = 25;

/**
 * order.inovitaz.in/order/:projectId — collect details + delivery address,
 * then create the order (payment of the 40% advance happens on the next
 * screen, /track). No payment is taken on this page.
 */
export default function OrderForm() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [project, setProject] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.name || "",
    phone: "",
    email: user?.email || "",
    deliveryAddressId: "",
    deliveryRoom: "",
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [projRes, addrRes, capRes] = await Promise.all([
        projectsAPI.getById(projectId),
        completeOrdersAPI.getDeliveryAddresses().catch(() => null),
        completeOrdersAPI.getCapacity().catch(() => null),
      ]);
      if (cancelled) return;
      const p = projRes?.data?.project || projRes?.data;
      if (p?.id) setProject(p);
      else {
        toast.error("That project is not available for complete builds.");
        navigate("/");
      }
      if (capRes?.success) setCapacity(capRes.data);
      if (addrRes?.success) {
        setAddresses(addrRes.data);
        const active = addrRes.data.find((a) => a.isActive);
        if (active) setForm((prev) => ({ ...prev, deliveryAddressId: String(active.id) }));
      }
      setLoadingProject(false);
    })();
    return () => { cancelled = true; };
  }, [projectId, navigate]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user?.name || "",
      email: prev.email || user?.email || "",
    }));
     
  }, [user]);

  const deadline = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + BUILD_DAYS);
    return d;
  }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast("Log in to place your order.", { icon: "🔐" });
      navigate("/login");
      return;
    }
    setSubmitting(true);
    try {
      const res = await completeOrdersAPI.create({
        projectId: Number(projectId),
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        deliveryAddressId: Number(form.deliveryAddressId),
        deliveryRoom: form.deliveryRoom,
        notes: form.notes,
      });
      if (res?.success) {
        toast.success("Order created — pay the 40% advance to start your build.");
        navigate("/track");
      } else {
        toast.error(res?.message || "Could not create your order.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not create your order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-surface-lowest flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (capacity && !capacity.accepting) {
    return (
      <div className="min-h-screen bg-surface-lowest flex items-center justify-center px-4">
        <div className="bg-surface border border-surface-variant rounded-2xl p-8 text-center max-w-md">
          <h1 className="t-h3 text-white mb-2">All build slots are full</h1>
          <p className="text-sm text-outline mb-6">
            We're at capacity ({capacity.limit} concurrent builds). A slot opens the moment a build
            completes — check back soon.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn btn-secondary min-h-11 inline-flex items-center">Back to catalog</Link>
            <Link to="/track" className="btn btn-primary min-h-11 inline-flex items-center">Track my order</Link>
          </div>
        </div>
      </div>
    );
  }

  const buildPrice = project?.build_price || 0;
  const advance = Math.round(buildPrice * 0.4);

  return (
    <div className="min-h-screen bg-surface-lowest">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-outline hover:text-white mb-6">
          <HiOutlineArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to all projects
        </Link>

        <div className="bg-surface border border-surface-variant rounded-2xl p-5 mb-6 flex gap-4 items-center">
          {project?.thumbnail && (
            <img src={project.thumbnail} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-outline mb-1">You are ordering</p>
            <h1 className="text-white font-semibold text-lg leading-snug">{project?.title}</h1>
          </div>
          {buildPrice > 0 && (
            <div className="text-right shrink-0">
              <p className="text-white font-bold text-xl">{formatINRFromPaise(buildPrice)}</p>
              <p className="text-xs text-primary-dim">{formatINRFromPaise(advance)} to start</p>
            </div>
          )}
        </div>

        {/* Deadline callout */}
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-8 flex gap-3">
          <HiOutlineCalendar className="w-6 h-6 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-outline">
            <span className="text-white font-medium">
              Delivery deadline: {deadline.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>{" "}
            — {BUILD_DAYS} days from today. Pay 40% now, 30% within 7 days, and the final 30% when
            your build is ready.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-8">
          {/* Contact */}
          <section className="bg-surface border border-surface-variant rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold">1 · Your details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-outline mb-1.5" htmlFor="fullName">Full name *</label>
                <input id="fullName" type="text" required value={form.fullName} onChange={set("fullName")} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-outline mb-1.5" htmlFor="phone">Phone (WhatsApp) *</label>
                <input id="phone" type="tel" required value={form.phone} onChange={set("phone")} placeholder="10-digit mobile" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-outline mb-1.5" htmlFor="email">Email *</label>
              <input id="email" type="email" required value={form.email} onChange={set("email")} className={inputClass} />
              <p className="text-xs text-outline mt-1">Your order confirmation and receipts go here.</p>
            </div>
          </section>

          {/* Delivery */}
          <section className="bg-surface border border-surface-variant rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <HiOutlineLocationMarker className="w-5 h-5 text-primary" aria-hidden="true" /> 2 · Delivery
            </h2>
            <div className="space-y-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                    !addr.isActive
                      ? "border-surface-variant opacity-60 cursor-not-allowed"
                      : String(form.deliveryAddressId) === String(addr.id)
                        ? "border-primary bg-primary/10 cursor-pointer"
                        : "border-surface-variant hover:border-outline cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryAddress"
                    value={addr.id}
                    disabled={!addr.isActive}
                    checked={String(form.deliveryAddressId) === String(addr.id)}
                    onChange={set("deliveryAddressId")}
                    className="accent-primary mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{addr.label}</span>
                      {!addr.isActive && (
                        <span className="badge badge-warning">Coming soon</span>
                      )}
                      {addr.isActive && (
                        <span className="badge badge-success">Available</span>
                      )}
                    </div>
                    <p className="text-xs text-outline mt-1">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ""}
                      {addr.isActive && addr.city !== "—" && `, ${addr.city}, ${addr.state} — ${addr.pincode}`}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm text-outline mb-1.5" htmlFor="deliveryRoom">
                Hostel block / room / who collects (optional)
              </label>
              <input
                id="deliveryRoom"
                type="text"
                value={form.deliveryRoom}
                onChange={set("deliveryRoom")}
                placeholder="e.g. MH-3, Room 412 — collect at reception"
                className={inputClass}
              />
            </div>
          </section>

          {/* Notes */}
          <section className="bg-surface border border-surface-variant rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-3">3 · Anything we should know? (optional)</h2>
            <textarea
              rows={3}
              value={form.notes}
              onChange={set("notes")}
              placeholder="Demo date, specific requirements, viva questions you're worried about…"
              className={inputClass}
            />
          </section>

          <button type="submit" disabled={submitting || !form.deliveryAddressId} className="btn btn-primary w-full min-h-11 inline-flex items-center justify-center disabled:opacity-60">
            {submitting ? "Creating your order…" : `Create order — pay ${formatINRFromPaise(advance)} to start`}
          </button>
          <p className="text-xs text-center text-outline">
            Payment happens on the next screen. You'll get an email confirmation with the full
            payment schedule.
          </p>
        </form>
      </div>
    </div>
  );
}
