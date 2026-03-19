"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    type ReactNode,
} from "react";
import { useSession } from "@/lib/auth-client";
import {
    getCartItems,
    addToCart as serverAddToCart,
    updateCartItemQuantity as serverUpdateQuantity,
    removeFromCart as serverRemoveFromCart,
    clearCart as serverClearCart,
    syncCartFromGuest,
    type CartItemData,
} from "@/actions/cart";

const GUEST_CART_KEY = "ades-cart";

interface GuestCartItem {
  productId: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItemData[];
  itemCount: number;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

function readGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestCartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function clearGuestCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CART_KEY);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const [items, setItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const prevAuth = useRef<boolean | null>(null);

  // Load cart on mount and on auth change
  useEffect(() => {
    async function load() {
      setLoading(true);

      if (isAuthenticated) {
        // If just signed in, sync guest cart first
        if (prevAuth.current === false) {
          const guestItems = readGuestCart();
          if (guestItems.length > 0) {
            await syncCartFromGuest(guestItems);
            clearGuestCart();
          }
        }

        const result = await getCartItems();
        setItems(result.data ?? []);
      } else {
        // Guest: we only store productId + quantity in localStorage
        // No product details for guest mode — they'll see full details on the cart page
        const guestItems = readGuestCart();
        setItems(
          guestItems.map((g) => ({
            productId: g.productId,
            quantity: g.quantity,
            product: { id: g.productId, name: "", slug: "", images: [], markupPrice: 0 },
          })),
        );
      }

      setLoading(false);
    }

    // Skip initial render where session is still loading
    if (prevAuth.current !== null || session !== undefined) {
      load();
    }

    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, session]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const addItem = useCallback(
    async (productId: string, quantity: number = 1) => {
      if (isAuthenticated) {
        await serverAddToCart(productId, quantity);
        const result = await getCartItems();
        setItems(result.data ?? []);
      } else {
        const guest = readGuestCart();
        const existing = guest.find((g) => g.productId === productId);
        if (existing) {
          existing.quantity = quantity;
        } else {
          guest.push({ productId, quantity });
        }
        writeGuestCart(guest);
        setItems(
          guest.map((g) => ({
            productId: g.productId,
            quantity: g.quantity,
            product: { id: g.productId, name: "", slug: "", images: [], markupPrice: 0 },
          })),
        );
      }
    },
    [isAuthenticated],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (isAuthenticated) {
        await serverUpdateQuantity(productId, quantity);
        const result = await getCartItems();
        setItems(result.data ?? []);
      } else {
        let guest = readGuestCart();
        if (quantity <= 0) {
          guest = guest.filter((g) => g.productId !== productId);
        } else {
          const existing = guest.find((g) => g.productId === productId);
          if (existing) existing.quantity = quantity;
        }
        writeGuestCart(guest);
        setItems(
          guest.map((g) => ({
            productId: g.productId,
            quantity: g.quantity,
            product: { id: g.productId, name: "", slug: "", images: [], markupPrice: 0 },
          })),
        );
      }
    },
    [isAuthenticated],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (isAuthenticated) {
        await serverRemoveFromCart(productId);
        const result = await getCartItems();
        setItems(result.data ?? []);
      } else {
        const guest = readGuestCart().filter((g) => g.productId !== productId);
        writeGuestCart(guest);
        setItems(
          guest.map((g) => ({
            productId: g.productId,
            quantity: g.quantity,
            product: { id: g.productId, name: "", slug: "", images: [], markupPrice: 0 },
          })),
        );
      }
    },
    [isAuthenticated],
  );

  const clearAll = useCallback(async () => {
    if (isAuthenticated) {
      await serverClearCart();
      setItems([]);
    } else {
      clearGuestCart();
      setItems([]);
    }
  }, [isAuthenticated]);

  return (
    <CartContext.Provider
      value={{ items, itemCount, loading, addItem, updateQuantity, removeItem, clearAll }}
    >
      {children}
    </CartContext.Provider>
  );
}
