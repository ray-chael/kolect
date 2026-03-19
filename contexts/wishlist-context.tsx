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
    getWishlistItems,
    toggleWishlist as serverToggle,
    syncWishlistFromGuest,
    type WishlistItemData,
} from "@/actions/wishlist";

const GUEST_WISHLIST_KEY = "ades-wishlist";

interface WishlistContextValue {
  items: WishlistItemData[];
  itemCount: number;
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}

function readGuestWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeGuestWishlist(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(ids));
}

function clearGuestWishlist() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_WISHLIST_KEY);
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const [items, setItems] = useState<WishlistItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const prevAuth = useRef<boolean | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      if (isAuthenticated) {
        if (prevAuth.current === false) {
          const guestIds = readGuestWishlist();
          if (guestIds.length > 0) {
            await syncWishlistFromGuest(guestIds);
            clearGuestWishlist();
          }
        }

        const result = await getWishlistItems();
        setItems(result.data ?? []);
      } else {
        const guestIds = readGuestWishlist();
        setItems(
          guestIds.map((id) => ({
            productId: id,
            product: { id, name: "", slug: "", images: [], markupPrice: 0 },
          })),
        );
      }

      setLoading(false);
    }

    if (prevAuth.current !== null || session !== undefined) {
      load();
    }

    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, session]);

  const itemCount = items.length;

  const isWishlisted = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items],
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (isAuthenticated) {
        await serverToggle(productId);
        const result = await getWishlistItems();
        setItems(result.data ?? []);
      } else {
        let guestIds = readGuestWishlist();
        if (guestIds.includes(productId)) {
          guestIds = guestIds.filter((id) => id !== productId);
        } else {
          guestIds.push(productId);
        }
        writeGuestWishlist(guestIds);
        setItems(
          guestIds.map((id) => ({
            productId: id,
            product: { id, name: "", slug: "", images: [], markupPrice: 0 },
          })),
        );
      }
    },
    [isAuthenticated],
  );

  return (
    <WishlistContext.Provider value={{ items, itemCount, loading, isWishlisted, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}
