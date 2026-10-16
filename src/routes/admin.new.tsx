import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/fh/ProductForm";

export const Route = createFileRoute("/admin/new")({
  head: () => ({ meta: [
    { title: "Add Product | FOOT HOUSE Admin" },
    { name: "description", content: "Add a FOOT HOUSE product with photos, NPR pricing and inventory." },
    { property: "og:title", content: "Add Product | FOOT HOUSE Admin" },
    { property: "og:description", content: "Add a FOOT HOUSE product with photos, NPR pricing and inventory." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <ProductForm />,
});
