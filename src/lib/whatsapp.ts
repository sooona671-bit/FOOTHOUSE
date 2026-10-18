import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { profileQuery } from "@/lib/profile";
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

type Customer = {
  name?: string | null | undefined;
  phone?: string | null | undefined;
  email?: string | null | undefined;
  address?: string | null | undefined;
};

/** Store owner's WhatsApp number: digits only, with country code (set VITE_WHATSAPP_NUMBER in .env). */
export const whatsappNumber = () => String(import.meta.env["VITE_WHATSAPP_NUMBER"] ?? "").replace(/\D/g, "");

export async function buildOrderMessage(lines: OrderLine[], customer: Customer) {
  const origin = window.location.origin;
  const many = lines.length > 1;
  const blocks = lines.map((l, i) =>
    [
      `${many ? `${i + 1}. ` : ""}*${l.name}*`,
      [l.size && `Size ${l.size}`, l.color, `Qty ${l.quantity}`, npr(l.price)].filter(Boolean).join(" • "),
      `${origin}/p/${l.productId}`,
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
