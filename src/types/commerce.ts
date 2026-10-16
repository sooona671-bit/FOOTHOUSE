// Domain shapes for upcoming steps (catalog, cart, orders...). Not yet backed by tables.
export type Money = { amount: number; currency: string };

export interface Category { id: string; slug: string; name: string; imageUrl?: string }
export interface Product {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: Money;
  compareAtPrice?: Money;
  rating?: number;
  badge?: "NEW" | "LIMITED" | "SALE";
  images: string[];
  sizes?: string[];
}
export interface CartItem { productId: string; size?: string; quantity: number }
export interface Address { id: string; label: string; line1: string; city: string; postalCode: string; country: string; phone?: string }
export type OrderStatus = "placed" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
export interface Order { id: string; status: OrderStatus; items: CartItem[]; total: Money; createdAt: string }
