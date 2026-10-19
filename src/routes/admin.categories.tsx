import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FhButton } from "@/components/fh/primitives";
import { adminCategoriesQuery, categoriesQuery, createCategory, deleteCategory } from "@/lib/categories";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "Categories | FOOT HOUSE Admin" }] }),
  component: AdminCategories,
});

function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading, error } = useQuery(adminCategoriesQuery);
  const [name, setName] = useState("");
  const add = useMutation({
    mutationFn: () => createCategory(name),
    onSuccess: async () => {
      setName("");
      await refresh(queryClient);
      toast.success("Category added");
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const remove = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await refresh(queryClient);
      toast.success("Category deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const input = "h-11 rounded-xl bg-surface px-4 text-sm text-foreground outline-none ring-primary focus:ring-2";

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-3xl font-bold text-foreground">Categories</h1><p className="mt-1 text-sm text-muted-foreground">These appear as Departments on the home screen, in this order.</p></div>
      <form onSubmit={(event) => { event.preventDefault(); if (name.trim()) add.mutate(); }} className="flex w-full max-w-md gap-2"><input className={`${input} min-w-0 flex-1`} maxLength={24} value={name} onChange={(event) => setName(event.target.value)} placeholder="New category" aria-label="New category" /><FhButton type="submit" disabled={add.isPending || !name.trim()}>{add.isPending ? "Adding…" : "Add category"}</FhButton></form>
    </div>
    {isLoading && <p className="text-sm text-muted-foreground">Loading categories…</p>}
    {error && <p className="text-sm text-destructive">Couldn't load categories. Please try again.</p>}
    {!isLoading && !error && categories.length === 0 && <div className="rounded-[24px] bg-card p-8 text-center text-sm text-muted-foreground">No categories yet.</div>}
    {!isLoading && !error && categories.length > 0 && <div className="overflow-hidden rounded-[24px] bg-card">
      {categories.map((category) => <div key={category.id} className="flex min-w-0 flex-col gap-4 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><p className="truncate font-semibold text-foreground">{category.name}</p><p className="text-xs text-muted-foreground">{category.productCount} product{category.productCount === 1 ? "" : "s"}</p></div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <span className={`rounded-xl px-3 py-2 text-xs font-semibold ${category.active ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"}`}>{category.active ? "Shown" : "Hidden"}</span>
          <AlertDialog><AlertDialogTrigger asChild><FhButton size="sm" variant="outline">Delete</FhButton></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {category.name}?</AlertDialogTitle><AlertDialogDescription>If products are assigned to this category, deletion will be blocked. Products are never deleted.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={remove.isPending} onClick={() => remove.mutate(category.id)}>Delete category</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>
      </div>)}
    </div>}
  </div>;
}

async function refresh(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminCategoriesQuery.queryKey }),
    queryClient.invalidateQueries({ queryKey: categoriesQuery.queryKey }),
  ]);
}
