import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineClock, HiOutlineExclamation } from "react-icons/hi";
import { completeOrdersAPI } from "../api/completeOrders";
import { paymentsAPI } from "../api/payments";
import { AuthContext } from "../context/AuthContext";
import { formatINRFromPaise } from "../utils/price";

const STATUS_META = {
  active: { label: "Active", cls: "badge badge-success" },
  paused: { label: "Paused — payment overdue", cls: "badge badge-danger" },
  ready: { label: "Ready for pickup", cls: "badge badge-success" },
  completed: { label: "Completed", cls: "badge badge-success" },
  cancelled: { label: "Cancelled", cls: "badge badge-danger" },
};

const INSTALL_META = {
  due: { label: "Due", cls: "badge badge-warning", icon: HiOutlineClock },
  paid: { label: "Paid", cls: "badge badge-success", icon: HiOutlineCheckCircle },
  overdue: { label: "Overdue", cls: "badge badge-danger", icon: HiOutlineExclamation },
  waived: { label: "Waived", cls: "badge badge-primary", icon: HiOutlineCheckCircle },
};

/**
 * order.inovitaz.in/track — the customer's order pipeline: 25-day deadline,
 * 3 installments with due dates + status, remaining balance, and one-click
 * Razorpay payment for the next due installment.
 */
export default function OrderTrack() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingKey, setPayingKey] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await completeOrdersAPI.getMine().catch(() => null);
    setOrders(res?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
  }, [user]);  

  const openCheckout = (order, inst, orderData) => {
    const finish = () => {
      toast.success("Payment received — thank you!");
      load();
    };
    if (orderData.isMockPayment) {
      paymentsAPI
        .verifyPayment({
          projectId: order.projectId,
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock_signature",
        })
        .then((r) => (r?.success ? finish() : toast.error(r?.message || "Verification failed")))
        .catch(() => toast.error("Verification failed"))
        .finally(() => setPayingKey(null));
      return;
    }
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name: "InovitaZ Builds",
      description: orderData.description,
      order_id: orderData.orderId,
      handler: async (response) => {
        try {
          const verify = await paymentsAPI.verifyPayment({
            projectId: order.projectId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (verify.success) finish();
          else toast.error(verify.message || "Verification failed");
        } catch (error) {
          toast.error(error.message || "Payment verification failed");
        } finally {
          setPayingKey(null);
        }
      },
      prefill: { name: order.fullName || user?.name || "", email: order.email || user?.email || "" },
      theme: { color: "#2563eb" },
      modal: { ondismiss: () => setPayingKey(null) },
    };
    new window.Razorpay(options).open();
  };

  const payInstallment = async (order, inst) => {
    const key = `${order.id}-${inst.installmentNumber}`;
    setPayingKey(key);
    try {
      const res = await completeOrdersAPI.payInstallment(order.id, inst.installmentNumber);
      if (!res?.success) {
        toast.error(res?.message || "Could not start payment");
        setPayingKey(null);
        return;
      }
      openCheckout(order, inst, res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not start payment");
      setPayingKey(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-lowest flex items-center justify-center px-4">
        <div className="bg-surface border border-surface-variant rounded-2xl p-8 text-center max-w-md">
          <h1 className="t-h3 text-white mb-2">Track your order</h1>
          <p className="text-sm text-outline mb-6">
            Log in with the account you used while ordering to see your deadline, installments and
            remaining balance.
          </p>
          <button type="button" onClick={() => navigate("/login")} className="btn btn-primary w-full min-h-11">
            Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-lowest">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="t-h1 text-white mb-1">Track my order</h1>
            <p className="text-sm text-outline">Deadline, installments and balance — all in one place.</p>
          </div>
          <button type="button" onClick={load} className="btn btn-secondary min-h-11 inline-flex items-center gap-2">
            <HiOutlineRefresh className="w-4 h-4" aria-hidden="true" /> Refresh
          </button>
        </div>

        {loading && (
          <div className="space-y-4" aria-busy="true">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 bg-surface border border-surface-variant rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="bg-surface border border-surface-variant rounded-2xl p-10 text-center">
            <p className="text-outline mb-4">No orders yet.</p>
            <Link to="/" className="btn btn-primary min-h-11 inline-flex items-center">Choose a project</Link>
          </div>
        )}

        <div className="space-y-5">
          {orders.map((order) => {
            const meta = STATUS_META[order.status] || STATUS_META.active;
            return (
              <article key={order.id} className="bg-surface border border-surface-variant rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                  <div>
                    <p className="text-xs text-outline mb-1">Order #{order.id}</p>
                    <h2 className="text-white font-semibold text-lg leading-snug">{order.projectTitle}</h2>
                    <p className="text-xs text-outline mt-1">
                      Ordered {new Date(order.createdAt).toLocaleDateString("en-IN")} ·{" "}
                      <span className="text-white font-medium">
                        Deadline {new Date(order.deadline).toLocaleDateString("en-IN")}
                      </span>{" "}
                      (25 days)
                    </p>
                    <p className="text-xs text-outline mt-0.5">
                      Deliver to: {order.deliveryLabel}
                      {order.deliveryRoom ? ` — ${order.deliveryRoom}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={meta.cls}>{meta.label}</span>
                    <p className="text-xs text-outline mt-2">Total {formatINRFromPaise(order.totalAmount)}</p>
                    <p className="text-sm text-white font-semibold">
                      Balance {formatINRFromPaise(order.remainingBalance)}
                    </p>
                  </div>
                </div>

                {/* Installments */}
                <div className="space-y-2">
                  {order.installments.map((inst) => {
                    const im = INSTALL_META[inst.status] || INSTALL_META.due;
                    const key = `${order.id}-${inst.installmentNumber}`;
                    const canPay = inst.status === "due" || inst.status === "overdue";
                    return (
                      <div
                        key={inst.installmentNumber}
                        className="flex items-center justify-between gap-4 flex-wrap bg-surface-lowest border border-surface-variant rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <im.icon className="w-5 h-5 text-outline" aria-hidden="true" />
                          <div>
                            <p className="text-sm text-white font-medium">{inst.label}</p>
                            <p className="text-xs text-outline">
                              Due {new Date(inst.dueDate).toLocaleDateString("en-IN")}
                              {inst.paidAt && ` · Paid ${new Date(inst.paidAt).toLocaleDateString("en-IN")}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white font-semibold">{formatINRFromPaise(inst.amount)}</span>
                          <span className={im.cls}>{im.label}</span>
                          {canPay && (
                            <button
                              type="button"
                              onClick={() => payInstallment(order, inst)}
                              disabled={payingKey === key}
                              className="btn btn-primary min-h-11 text-sm disabled:opacity-60"
                            >
                              {payingKey === key ? "Opening…" : "Pay now"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
