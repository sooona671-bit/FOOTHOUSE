import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminProductsQuery } from "@/lib/products";
import { ProductForm } from "@/components/fh/ProductForm";

export const Route = createFileRoute("/admin/$id")({
  head: () => ({ meta: [
    { title: "Edit Product | FOOT HOUSE Admin" },
    { name: "description", content: "Edit FOOT HOUSE product details, NPR pricing and inventory." },
    { property: "og:title", content: "Edit Product | FOOT HOUSE Admin" },
    { property: "og:description", content: "Edit FOOT HOUSE product details, NPR pricing and inventory." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(adminProductsQuery);
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const product = data?.find((p) => p.id === id);
  if (!product) return <p className="text-sm text-muted-foreground">Product not found.</p>;
  return <ProductForm key={product.id} product={product} />;
}
