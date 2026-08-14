import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const STORAGE_KEY = "inovitaz_cart";

const CartContext = createContext(null);

/**
 * Client-side shopping cart, persisted to localStorage.
 *
 * NOTE: The backend currently processes one project per order (the `orders`
 * table holds a single `project_id`), so the cart holds items and checkout
 * completes each purchase individually on that project's page. Digital
 * products are single-copy — quantity is fixed at 1.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — cart lives for this session only
    }
  }, [items]);

  const add = useCallback((project) => {
    if (!project?.id) return;
    setItems((prev) => {
      // Digital product — one copy per user, so ignore duplicates.
      if (prev.some((it) => it.id === project.id)) return prev;
      return [
        ...prev,
        {
          id: project.id,
          title: project.title,
          price: Number(project.price ?? 0),
          thumbnail: project.thumbnail || project.image_url || null,
          category: project.category || "IoT",
        },
      ];
    });
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      add,
      remove,
      clear,
      has: (id) => items.some((it) => it.id === id),
      count: items.length,
      subtotalPaise: items.reduce((sum, it) => sum + (it.price || 0), 0),
    }),
    [items, add, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    // Safe fallback when used outside the provider.
    return {
      items: [],
      add: () => {},
      remove: () => {},
      clear: () => {},
      has: () => false,
      count: 0,
      subtotalPaise: 0,
    };
  }
  return ctx;
}

export default CartContext;
