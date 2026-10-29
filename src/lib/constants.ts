/**
 * Ezone4u Store Constants & Shipping Rules
 * Fixed shipping fee rule: ₹60 per order (charged once per order, never multiplied by quantity).
 */
export const STORE_CONFIG = {
  SHIPPING_FEE: 60, // Fixed shipping fee of ₹60 per order
  CURRENCY: "INR",
  CURRENCY_SYMBOL: "₹",
} as const;

/**
 * Reusable order totals calculation helper for Cart, Checkout, and Order processing.
 */
export function calculateOrderTotals(subtotal: number) {
  const shippingFee = subtotal > 0 ? STORE_CONFIG.SHIPPING_FEE : 0;
  const total = subtotal + shippingFee;
  return {
    subtotal,
    shippingFee,
    total,
  };
}

/**
 * Standard Indian Rupee (INR) currency formatter.
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
