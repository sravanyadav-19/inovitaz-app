import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineRefresh, HiOutlineCube } from "react-icons/hi";
import { completeOrdersAPI } from "../../api/completeOrders";
import { formatINRFromPaise } from "../../utils/price";

const ORDER_STATUS = {
  active: { label: "Active", cls: "badge badge-success" },
  paused: { label: "Paused (overdue)", cls: "badge badge-danger" },
  ready: { label: "Ready for pickup", cls: "badge badge-success" },
  completed: { label: "Completed", cls: "badge badge-success" },
  cancelled: { label: "Cancelled", cls: "badge badge-danger" },
};

const INST_CLS = {
  due: "badge badge-warning",
  paid: "badge badge-success",
  overdue: "badge badge-danger",
  waived: "badge badge-primary",
};

/**
 * Admin view for complete-build orders: see the 40/30/30 installment status
 * per order, mark builds ready (which unlocks the final 30%), pause or
 * complete jobs.
 */
export default function AdminBuilds() {
  const [orders, setOrders] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [limitDraft, setLimitDraft] = useState("");
  const [savingLimit, setSavingLimit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, capRes] = await Promise.all([
      completeOrdersAPI.getAll().catch(() => null),
      completeOrdersAPI.getCapacity().catch(() => null),
    ]);
    setOrders(res?.data || []);
    if (capRes?.success) {
      setCapacity(capRes.data);
      setLimitDraft(String(capRes.data.limit));
    }
    setLoading(false);
  }, []);

  const saveLimit = async () => {
    const limit = Number(limitDraft);
    if (!Number.isInteger(limit) || limit < 0 || limit > 100) {
      toast.error("Enter a whole number 0–100 (0 = ordering closed)");
      return;
    }
    setSavingLimit(true);
    try {
      const res = await completeOrdersAPI.updateCapacity(limit);
      if (res?.success) {
        if (res.data.savedValue !== undefined && res.data.savedValue !== limit) {
          toast.error(`Server saved ${res.data.savedValue} instead of ${limit} — screenshot this and report it`);
          setCapacity(res.data);
          setLimitDraft(String(res.data.limit));
          setSavingLimit(false);
          return;
        }
        // Re-read fresh state: if the display flips back, the write didn't stick.
        const capRes = await completeOrdersAPI.getCapacity().catch(() => null);
        if (capRes?.success) {
          setCapacity(capRes.data);
          setLimitDraft(String(capRes.data.limit));
        } else {
          setCapacity(res.data);
        }
        toast.success(
          res.data.accepting
            ? `Limit set to ${res.data.limit} — ${res.data.slotsLeft} slot(s) open`
            : `Limit set to ${res.data.limit} — ordering is now closed`
        );
      } else {
        toast.error(res?.message || "Failed to update the limit");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update the limit");
    } finally {
      setSavingLimit(false);
    }
  };

  useEffect(() => { load(); }, [load]);

  const setStatus = async (order, status) => {
    setSavingId(order.id);
    try {
      const res = await completeOrdersAPI.update(order.id, { status });
      if (res?.success) {
        toast.success(`Order #${order.id} → ${ORDER_STATUS[status].label}`);
        load();
      } else {
        toast.error(res?.message || "Update failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="t-h2 text-white flex items-center gap-2">
            <HiOutlineCube className="w-6 h-6 text-primary" aria-hidden="true" /> Build orders
          </h2>
          <p className="text-sm text-outline mt-1">
            order.inovitaz.in — 40/30/30 payment tracking and build status.
          </p>
        </div>
        <button type="button" onClick={load} className="btn btn-secondary min-h-11 inline-flex items-center gap-2">
          <HiOutlineRefresh className="w-4 h-4" aria-hidden="true" /> Refresh
        </button>
      </div>

      {/* Capacity control */}
      <div className="bg-surface border border-surface-variant rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white font-semibold">Build slot limit</p>
          <p className="text-xs text-outline mt-1">
            {capacity
              ? capacity.accepting
                ? `${capacity.activeCount} active · ${capacity.slotsLeft} slot(s) open on order.inovitaz.in`
                : `${capacity.activeCount} active · ordering is CLOSED (limit ${capacity.limit})`
              : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            value={limitDraft}
            onChange={(e) => setLimitDraft(e.target.value)}
            className="w-24 bg-surface-lowest border border-surface-variant rounded-lg px-3 py-2 text-white text-sm min-h-11"
            aria-label="Build slot limit"
          />
          <button
            type="button"
            onClick={saveLimit}
            disabled={savingLimit}
            className="btn btn-primary min-h-11 text-sm disabled:opacity-60"
          >
            {savingLimit ? "Saving…" : "Save limit"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-4" aria-busy="true">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 bg-surface border border-surface-variant rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="bg-surface border border-surface-variant rounded-2xl p-10 text-center">
          <p className="text-outline">No complete-build orders yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const meta = ORDER_STATUS[order.status] || ORDER_STATUS.active;
          return (
            <article key={order.id} className="bg-surface border border-surface-variant rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <p className="text-xs text-outline mb-1">
                    Order #{order.id} · {new Date(order.createdAt).toLocaleString("en-IN")}
                  </p>
                  <h3 className="text-white font-semibold text-lg leading-snug">{order.projectTitle}</h3>
                  <p className="text-xs text-outline mt-1">
                    {order.fullName} · {order.userEmail} · {order.phone}
                  </p>
                  <p className="text-xs text-outline mt-0.5">
                    Deliver: {order.deliveryLabel}
                    {order.deliveryRoom ? ` — ${order.deliveryRoom}` : ""} · Deadline{" "}
                    <span className="text-white">{new Date(order.deadline).toLocaleDateString("en-IN")}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className={meta.cls}>{meta.label}</span>
                  <p className="text-xs text-outline mt-2">
                    Collected {formatINRFromPaise(order.paidAmount)} / {formatINRFromPaise(order.totalAmount)}
                  </p>
                  <p className="text-sm text-white font-semibold">
                    Balance {formatINRFromPaise(order.remainingBalance)}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-2 mb-4">
                {order.installments.map((inst) => (
                  <div key={inst.installmentNumber} className="bg-surface-lowest border border-surface-variant rounded-xl px-4 py-3">
                    <p className="text-xs text-outline">{inst.label}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-white font-semibold text-sm">{formatINRFromPaise(inst.amount)}</span>
                      <span className={INST_CLS[inst.status] || INST_CLS.due}>{inst.status}</span>
                    </div>
                    <p className="text-xs text-outline mt-1">
                      due {new Date(inst.dueDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {order.notes && (
                <p className="text-sm text-outline mb-4 bg-surface-lowest rounded-xl px-4 py-3">
                  Customer note: {order.notes}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {order.status === "active" && (
                  <>
                    <button type="button" onClick={() => setStatus(order, "ready")} disabled={savingId === order.id}
                      className="btn btn-primary min-h-11 text-sm disabled:opacity-60">
                      → Mark ready for pickup
                    </button>
                    <button type="button" onClick={() => setStatus(order, "paused")} disabled={savingId === order.id}
                      className="min-h-11 px-4 rounded-lg text-sm bg-surface-high text-white border border-surface-variant hover:border-outline disabled:opacity-60">
                      Pause
                    </button>
                  </>
                )}
                {order.status === "paused" && (
                  <button type="button" onClick={() => setStatus(order, "active")} disabled={savingId === order.id}
                    className="btn btn-primary min-h-11 text-sm disabled:opacity-60">
                    → Resume
                  </button>
                )}
                {order.status === "ready" && (
                  <button type="button" onClick={() => setStatus(order, "completed")} disabled={savingId === order.id}
                    className="btn btn-primary min-h-11 text-sm disabled:opacity-60">
                    → Mark completed
                  </button>
                )}
                {(order.status === "active" || order.status === "paused") && (
                  <button type="button" onClick={() => setStatus(order, "cancelled")} disabled={savingId === order.id}
                    className="min-h-11 px-4 rounded-lg text-sm bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 disabled:opacity-60">
                    Cancel order
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
