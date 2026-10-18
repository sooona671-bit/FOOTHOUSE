import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_TITLE = "FOOT HOUSE — Premium Footwear";
const DEFAULT_DESCRIPTION = "FOOT HOUSE — premium footwear and fashion essentials.";

type ShareProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  sizes: string[];
  imagePath: string | null;
};

function siteOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  const configured = import.meta.env["VITE_SITE_URL"] ?? import.meta.env["VITE_SITE_ORIGIN"] ?? import.meta.env["VITE_APP_URL"];
  return String(configured || "https://foothouse-vert.vercel.app").replace(/\/$/, "");
}

function publicImageUrl(path: string) {
  const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${String(supabaseUrl).replace(/\/$/, "")}/storage/v1/object/public/product-images/${encodedPath}`;
}

export const Route = createFileRoute("/p/$id")({
  loader: async ({ params }): Promise<ShareProduct | null> => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, category, sizes, images")
      .eq("id", params.id)
      .eq("published", true)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      price: data.price,
      category: data.category,
      sizes: data.sizes,
      imagePath: data.images[0] ?? null,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: DEFAULT_TITLE },
          { name: "description", content: DEFAULT_DESCRIPTION },
          { property: "og:title", content: DEFAULT_TITLE },
          { property: "og:description", content: DEFAULT_DESCRIPTION },
        ],
      };
    }

    const title = `${loaderData.name} — NPR ${loaderData.price.toLocaleString("en-IN")}`;
    const description = `${loaderData.category} • Sizes ${loaderData.sizes.join(", ")} • FOOT HOUSE`;
    const pageUrl = `${siteOrigin()}/p/${encodeURIComponent(loaderData.id)}`;
    const imageUrl = loaderData.imagePath ? publicImageUrl(loaderData.imagePath) : undefined;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(imageUrl
          ? [
              { property: "og:image", content: imageUrl },
              { property: "og:image:width", content: "1200" },
              { property: "og:image:height", content: "1200" },
              { property: "og:image:alt", content: loaderData.name },
            ]
          : []),
        { property: "og:type", content: "website" },
        { property: "og:url", content: pageUrl },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        ...(imageUrl ? [{ name: "twitter:image", content: imageUrl }] : []),
      ],
    };
  },
  component: ShareProductPage,
});

function ShareProductPage() {
  const navigate = useNavigate();
  const product = Route.useLoaderData();
  const { id } = Route.useParams();

  useEffect(() => {
    void navigate(product ? { to: "/product/$id", params: { id }, replace: true } : { to: "/home", replace: true });
  }, [id, navigate, product]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <img src="/assets/brand-logo.png" alt="FOOT HOUSE" width={96} height={96} decoding="async" className="h-24 w-24 object-contain" />
        <p className="text-sm text-neutral-500">Opening product…</p>
      </div>
    </main>
  );
}
