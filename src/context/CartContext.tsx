"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useSyncExternalStore,
  ReactNode,
} from "react";

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
  imageUrl?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "ezone4u_cart_items_v1";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("ezone4u-cart-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("ezone4u-cart-change", callback);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem(CART_STORAGE_KEY) || "[]";
  } catch {
    return "[]";
  }
}

function getServerSnapshot(): string {
  return "[]";
}

function saveCart(items: CartItem[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event("ezone4u-cart-change"));
    } catch {
      // Ignore
    }
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const cartJson = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const items: CartItem[] = useMemo(() => {
    try {
      return JSON.parse(cartJson);
    } catch {
      return [];
    }
  }, [cartJson]);

  const addItem = useCallback(
    (itemData: Omit<CartItem, "quantity">, quantityToAdd: number = 1) => {
      const existing = [...items];
      const existingIndex = existing.findIndex(
        (i) =>
          i.productId === itemData.productId &&
          i.variantId === itemData.variantId &&
          i.size === itemData.size &&
          i.color === itemData.color
      );

      if (existingIndex > -1) {
        existing[existingIndex].quantity += quantityToAdd;
      } else {
        existing.push({
          ...itemData,
          id:
            itemData.id ||
            `${itemData.productId}-${itemData.variantId || "default"}-${Date.now()}`,
          quantity: quantityToAdd,
        });
      }
      saveCart(existing);
    },
    [items]
  );

  const removeItem = useCallback(
    (id: string) => {
      const updated = items.filter((item) => item.id !== id);
      saveCart(updated);
    },
    [items]
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) {
        const updated = items.filter((item) => item.id !== id);
        saveCart(updated);
        return;
      }
      const updated = items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      saveCart(updated);
    },
    [items]
  );

  const clearCart = useCallback(() => {
    saveCart([]);
  }, []);

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
