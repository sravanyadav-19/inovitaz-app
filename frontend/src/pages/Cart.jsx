import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiShoppingCart,
  HiTrash,
  HiShieldCheck,
  HiSupport,
  HiTag,
  HiArrowRight,
  HiPlus,
} from "react-icons/hi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../hooks/useAuth";
import { projectsAPI } from "../api/projects";
import { couponsAPI } from "../api/payments";
import { formatINRFromPaise } from "../utils/price";
import toast from "react-hot-toast";

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="#0c1324"/><circle cx="100" cy="60" r="20" fill="#23293c" stroke="#3b82f6" stroke-width="2"/><text x="100" y="105" fill="#8c909f" font-family="Arial" font-size="12" text-anchor="middle">IoT Project</text></svg>`
  );

const PAYMENT_METHODS = ["UPI", "Cards", "Netbanking", "Wallets"];

export default function Cart() {
  const { items, remove, add, has, count, subtotalPaise } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Suggested add-ons: a few projects not already in the cart.
  useEffect(() => {
    (async () => {
      try {
        const res = await projectsAPI.getAll({ limit: 4 });
        if (res.success && res.data?.projects) {
          setSuggestions(
            res.data.projects
              .filter((p) => !items.some((it) => it.id === p.id))
              .slice(0, 3)
          );
        }
      } catch {
        // Backend not reachable — hide the strip quietly.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = subtotalPaise;
  const total = appliedCoupon ? appliedCoupon.final_amount : subtotal;

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to buy.");
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleBuyItem = (id) => {
    if (!requireAuth()) return;
    navigate(`/projects/${id}?action=buy`);
  };

  const handleCheckout = () => {
    if (!requireAuth()) return;
    if (items.length === 1) {
      navigate(`/projects/${items[0].id}?action=buy`);
      return;
    }
    toast("Each project is purchased individually — use Buy now on each item.", {
      icon: "ℹ️",
    });
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Enter a coupon code");
      return;
    }
    if (items.length !== 1) {
      toast("Coupons apply to a single project — apply it during checkout.", {
        icon: "ℹ️",
      });
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await couponsAPI.validate(code, items[0].id, items[0].price);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        toast.success(res.data.savings_text || "Coupon applied");
      } else {
        setCouponError(res?.message || "Invalid coupon");
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError(err.message || "Invalid coupon");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  // ---- Empty state ----
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-surface-lowest fade-in flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-6">
            <HiShoppingCart className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Your cart is empty</h1>
          <p className="text-outline mb-8">
            Browse the catalog and add projects you'd like to build.
          </p>
          <Link to="/projects" className="btn btn-primary btn-lg inline-flex items-center gap-2">
            Browse Projects <HiArrowRight />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-lowest fade-in py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">
            Your Cart{" "}
            <span className="text-outline text-xl font-normal">
              ({count} {count === 1 ? "project" : "projects"})
            </span>
          </h1>
          <Link to="/projects" className="text-sm text-primary hover:text-primary-dim font-medium">
            ← Continue shopping
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ---- Items ---- */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="card flex gap-4 p-4 sm:p-5"
              >
                <Link
                  to={`/projects/${item.id}`}
                  className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-surface-lowest border border-surface-variant"
                >
                  <img
                    src={item.thumbnail || FALLBACK_IMAGE}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </Link>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/projects/${item.id}`}
                        className="font-semibold text-white hover:text-primary-dim transition-colors line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-outline mt-1">
                        <span className="inline-block bg-primary/15 text-primary-fixed border border-primary-dim/30 rounded-full px-2 py-0.5 mr-2">
                          {item.category}
                        </span>
                        Digital download · 1 copy
                      </p>
                    </div>
                    <button
                      onClick={() => remove(item.id)}
                      aria-label={`Remove ${item.title} from cart`}
                      className="p-2 text-outline hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                    >
                      <HiTrash className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-xl font-display font-bold text-primary-dim text-glow">
                      {formatINRFromPaise(item.price)}
                    </span>
                    <button
                      onClick={() => handleBuyItem(item.id)}
                      className="btn btn-primary px-4 py-2 text-sm"
                    >
                      Buy now
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* ---- Suggested add-ons ---- */}
            {suggestions.length > 0 && (
              <div className="pt-6">
                <h2 className="text-lg font-semibold text-white mb-4">You might also like</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {suggestions.map((s) => {
                    const inCart = has(s.id);
                    return (
                      <div key={s.id} className="card p-3 flex flex-col">
                        <Link to={`/projects/${s.id}`} className="block h-24 rounded-lg overflow-hidden bg-surface-lowest border border-surface-variant mb-3">
                          <img
                            src={s.thumbnail || s.image_url || FALLBACK_IMAGE}
                            alt={s.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />
                        </Link>
                        <Link to={`/projects/${s.id}`} className="text-sm font-medium text-white hover:text-primary-dim line-clamp-1">
                          {s.title}
                        </Link>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <span className="text-sm font-bold text-primary-dim">
                            {formatINRFromPaise(s.price)}
                          </span>
                          <button
                            onClick={() => {
                              if (inCart) {
                                toast("Already in your cart");
                              } else {
                                add(s);
                                toast.success("Added to cart");
                              }
                            }}
                            disabled={inCart}
                            className="p-2 rounded-lg bg-surface-highest border border-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-50"
                            aria-label={`Add ${s.title} to cart`}
                          >
                            {inCart ? (
                              <span className="text-xs text-outline">In cart</span>
                            ) : (
                              <HiPlus className="w-4 h-4 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ---- Order summary ---- */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-white mb-4">Order summary</h2>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-outline">
                  <span>Subtotal</span>
                  <span className="text-white">{formatINRFromPaise(subtotal)}</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-{formatINRFromPaise(appliedCoupon.discount_amount)}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-between items-baseline border-t border-surface-variant pt-4 mb-4">
                <span className="font-semibold text-white">Total</span>
                <span className="text-2xl font-display font-bold text-primary-dim text-glow">
                  {formatINRFromPaise(total)}
                </span>
              </div>

              {/* Coupon */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 mb-4">
                  <span className="text-sm text-green-400 font-medium">
                    {appliedCoupon.code} applied — {appliedCoupon.savings_text}
                  </span>
                  <button onClick={removeCoupon} className="text-xs text-outline hover:text-white underline">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <HiTag className="w-4 h-4 text-outline" />
                      </div>
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value);
                          setCouponError("");
                        }}
                        placeholder="Coupon code"
                        className="input pl-9 w-full"
                      />
                    </div>
                    <button type="submit" disabled={couponLoading} className="btn btn-primary px-4 py-2 whitespace-nowrap">
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-400 mt-1">{couponError}</p>}
                  {items.length > 1 && (
                    <p className="text-xs text-outline mt-1">
                      Coupons apply per project — add one during checkout.
                    </p>
                  )}
                </form>
              )}

              {/* Checkout */}
              {items.length === 1 ? (
                <button
                  onClick={handleCheckout}
                  className="w-full btn btn-primary btn-lg flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <HiArrowRight />
                </button>
              ) : (
                <p className="text-xs text-outline text-center leading-relaxed">
                  Payments are processed per project. Use <span className="text-white">Buy now</span> on
                  each item to complete its purchase.
                </p>
              )}

              {/* Payment methods */}
              <div className="mt-5 pt-4 border-t border-surface-variant">
                <p className="text-xs text-outline mb-2 flex items-center gap-1.5">
                  <HiShieldCheck className="w-4 h-4 text-green-500" />
                  Secure payments via Razorpay
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PAYMENT_METHODS.map((m) => (
                    <span
                      key={m}
                      className="text-[11px] font-semibold tracking-wide text-outline border border-surface-variant rounded-md px-2 py-1"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Support */}
              <div className="mt-4 flex items-center gap-2 text-sm">
                <HiSupport className="w-4 h-4 text-primary" />
                <Link to="/support" className="text-primary hover:text-primary-dim font-medium">
                  Need help with your order?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
