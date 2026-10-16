import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminProductsQuery, PRODUCT_BUCKET, type ProductWithUrls } from "@/lib/products";
import { FhButton, Icon } from "@/components/fh/primitives";
import { npr } from "@/lib/shop";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [
    { title: "Products | FOOT HOUSE Admin" },
    { name: "description", content: "Manage FOOT HOUSE products, pricing in NPR, stock and availability." },
    { property: "og:title", content: "Products | FOOT HOUSE Admin" },
    { property: "og:description", content: "Manage FOOT HOUSE products, pricing in NPR, stock and availability." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminProducts,
});

function AdminProducts() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(adminProductsQuery);
  const [q, setQ] = useState("");
  const list = data.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase()));

  const del = useMutation({
    mutationFn: async (p: ProductWithUrls) => {
      const { error } = await supabase.from("products").delete().eq("id", p.id);
      if (error) throw error;
      if (p.images.length) await supabase.storage.from(PRODUCT_BUCKET).remove(p.images);
    },
    onSuccess: () => { toast.success("Product deleted"); qc.invalidateQueries({ queryKey: ["products"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">{data.length} products · {data.filter((p) => p.published).length} published</p>
        </div>
        <Link to="/admin/new"><FhButton size="md" className="h-11 px-5"><Icon name="add" className="text-[18px]" /> Add product</FhButton></Link>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="h-11 w-full max-w-sm rounded-full bg-card px-5 text-sm outline-none ring-primary focus:ring-2" />
      <div className="overflow-hidden rounded-[24px] bg-card">
        {isLoading ? <p className="p-8 text-sm text-muted-foreground">Loading…</p> : list.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground">No products yet. Add your first one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-4">Product</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Status</th><th className="p-4" /></tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface">
                        {p.imageUrls[0] && <img src={p.imageUrls[0]} alt={p.name} className="h-full w-full object-cover" />}
                      </div>
                      <div><p className="font-semibold text-foreground">{p.name}</p><p className="text-xs text-muted-foreground">{p.category}</p></div>
                    </div>
                  </td>
                  <td className="p-4">{npr(p.price)}</td>
                  <td className="p-4">{p.stock}</td>
                  <td className="p-4">
                    <span className={p.published ? "rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground" : "rounded-full bg-surface px-2.5 py-1 text-xs text-muted-foreground"}>
                      {p.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link to="/admin/$id" params={{ id: p.id }} className="mr-2 inline-flex rounded-full p-2 hover:bg-surface" aria-label={`Edit ${p.name}`}><Icon name="edit" className="text-[18px]" /></Link>
                    <button aria-label={`Delete ${p.name}`} className="inline-flex rounded-full p-2 text-destructive hover:bg-surface" onClick={() => confirm(`Delete "${p.name}"?`) && del.mutate(p)}>
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
