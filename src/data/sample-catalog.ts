// Static Home screen art (hero + department chips). Products now come from the database; newArrivals is unused legacy sample data.
// Temporary display data for the Home screen until the catalog is backed by the database (Step 2).
import type { Product } from "@/types/commerce";
import sneaker from "@/assets/onboarding-2.jpg";
import coat from "@/assets/onboarding-1.jpg";
import tailoring from "@/assets/onboarding-3.jpg";

export const departments = ["All Drops", "Sneakers", "Formal", "Boots", "Sandals"];

const npr = (amount: number) => ({ amount, currency: "NPR" });

export const newArrivals: Product[] = [
  { id: "1", slug: "platform-low", name: "Atelier Platform Low", categoryId: "sneakers", categoryName: "Footwear", price: npr(220), compareAtPrice: npr(260), rating: 4.9, badge: "NEW", images: [sneaker] },
  { id: "2", slug: "city-slip-on", name: "City Leather Slip-On", categoryId: "formal", categoryName: "Footwear", price: npr(180), rating: 4.8, badge: "LIMITED", images: [tailoring] },
  { id: "3", slug: "derby-boot", name: "Monochrome Derby Boot", categoryId: "boots", categoryName: "Footwear", price: npr(290), rating: 4.7, images: [coat] },
];

export const heroImage = coat;
