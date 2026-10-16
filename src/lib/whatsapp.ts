import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { profileQuery } from "@/lib/profile";
import { PRODUCT_BUCKET } from "@/lib/products";
import { npr } from "@/lib/shop";

export type OrderLine = {
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  /** Storage path of the cover image (first photo). */
  imagePath?: string | undefined;
};

type Customer = { name?: string | null; phone?: string | null; email?: string | null; address?: string | null };

const SEVEN_DAYS = 60 * 60 * 24 * 7;

/** Store owner's WhatsApp number: digits only, with country code (set VITE_WHATSAPP_NUMBER in .env). */
export const whatsappNumber = () => String(import.meta.env.VITE_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

export async function buildOrderMessage(lines: OrderLine[], customer: Customer) {
  // Photos live in a private bucket, so each photo link is a signed link valid for 7 days.
  const paths = Array.from(new Set(lines.map((l) => l.imagePath).filter(Boolean) as string[]));
  const photo = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(PRODUCT_BUCKET).createSignedUrls(paths, SEVEN_DAYS);
    data?.forEach((d) => d.path && d.signedUrl && photo.set(d.path, d.signedUrl));
  }
  const origin = window.location.origin;
  const many = lines.length > 1;
  const blocks = lines.map((l, i) =>
    [
      `${many ? `${i + 1}. ` : ""}*${l.name}*`,
      `Price: ${npr(l.price)}`,
      l.size && `Size: ${l.size}`,
      l.color && `Colour: ${l.color}`,
      `Qty: ${l.quantity}`,
      `Link: ${origin}/product/${l.productId}`,
      l.imagePath && photo.get(l.imagePath) && `Photo: ${photo.get(l.imagePath)}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const who = [
    customer.name && `Name: ${customer.name}`,
    customer.phone && `Phone: ${customer.phone}`,
    customer.email && `Email: ${customer.email}`,
    customer.address && `Deliver to: ${customer.address}`,
  ].filter(Boolean);
  return [
    "Hello FOOT HOUSE! I would like to order:",
    "",
    blocks.join("\n\n"),
    ...(many ? ["", `Total: ${npr(total)}`] : []),
    ...(who.length ? ["", ...(who as string[])] : []),
  ].join("\n");
}

/** Builds the order message and opens WhatsApp (app on phones, WhatsApp Web on desktop). */
export function useWhatsAppOrder() {
  const { user } = useAuth();
  const { data: profile } = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });
  const { data: address } = useQuery({
    queryKey: ["addresses", user?.id, "default"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").eq("is_default", true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [sending, setSending] = useState(false);

  const send = async (lines: OrderLine[]) => {
    const number = whatsappNumber();
    if (!number) {
      toast.error("WhatsApp number is not set yet.", { description: "Add VITE_WHATSAPP_NUMBER to the .env file." });
      return;
    }
    if (!lines.length) {
      toast.error("Nothing to order.");
      return;
    }
    setSending(true);
    try {
      const text = await buildOrderMessage(lines, {
        name: profile?.full_name,
        phone: profile?.phone,
        email: user?.email,
        address: address
          ? `${address.full_name}, ${address.phone}, ${[address.line1, address.line2, address.city, address.district].filter(Boolean).join(", ")}`
          : null,
      });
      window.location.href = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
    } catch {
      toast.error("Couldn't open WhatsApp. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return { send, sending };
}
