import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FhButton, Icon } from "@/components/fh/primitives";
import { adminCategoriesQuery, categoriesQuery, createCategory, deleteCategory, renameCategory, toggleCategory, useMoveCategory } from "@/lib/categories";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "Categories | FOOT HOUSE Admin" }, { name: "description", content: "Manage FOOT HOUSE product categories and departments." }] }),
  component: AdminCategories,
});

function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading, error } = useQuery(adminCategoriesQuery);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const add = useMutation({
    mutationFn: () => createCategory(name),
    onSuccess: async () => { setName(""); await refresh(queryClient); toast.success("Category added"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rename = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => renameCategory(id, value),
    onSuccess: async () => { setEditingId(null); await refresh(queryClient); toast.success("Category renamed"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: toggleCategory,
    onSuccess: () => refresh(queryClient),
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => { await refresh(queryClient); toast.success("Category deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const move = useMoveCategory();
  const input = "h-11 rounded-xl bg-surface px-4 text-sm text-foreground outline-none ring-primary focus:ring-2";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">These appear as Departments on the home screen, in this order.</p>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); if (name.trim()) add.mutate(); }} className="flex w-full max-w-md gap-2">
          <input className={`${input} min-w-0 flex-1`} maxLength={24} value={name} onChange={(event) => setName(event.target.value)} placeholder="New category" aria-label="New category" />
          <FhButton type="submit" disabled={add.isPending || !name.trim()}>{add.isPending ? "Adding…" : "Add category"}</FhButton>
        </form>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading categories…</p>}
      {error && <p className="text-sm text-destructive">Couldn't load categories. Please try again.</p>}
      {!isLoading && !error && categories.length === 0 && <div className="rounded-[24px] bg-card p-8 text-center text-sm text-muted-foreground">No categories yet.</div>}
      <div className="overflow-hidden rounded-[24px] bg-card">
        {categories.map((category, index) => (
          <div key={category.id} className="flex flex-wrap items-center gap-3 border-b border-border p-4 last:border-b-0">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex flex-col gap-1">
                <button type="button" aria-label={`Move ${category.name} up`} disabled={index === 0 || move.isPending} onClick={() => move.mutate({ id: category.id, direction: "up" })} className="text-outline hover:text-foreground disabled:opacity-30"><Icon name="keyboard_arrow_up" className="text-[18px]" /></button>
                <button type="button" aria-label={`Move ${category.name} down`} disabled={index === categories.length - 1 || move.isPending} onClick={() => move.mutate({ id: category.id, direction: "down" })} className="text-outline hover:text-foreground disabled:opacity-30"><Icon name="keyboard_arrow_down" className="text-[18px]" /></button>
              </div>
              {editingId === category.id ? (
                <input className={`${input} h-10 min-w-0 flex-1`} maxLength={24} value={editingName} onChange={(event) => setEditingName(event.target.value)} autoFocus />
              ) : (
                <div className="min-w-0"><p className="truncate font-semibold text-foreground">{category.name}</p><p className="text-xs text-muted-foreground">{category.productCount} product{category.productCount === 1 ? "" : "s"}</p></div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" role="switch" aria-checked={category.active} onClick={() => toggle.mutate(category.id)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-surface px-3 text-xs font-semibold text-foreground">
                <span className={`relative h-5 w-9 rounded-full transition-colors ${category.active ? "bg-primary" : "bg-outline/40"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${category.active ? "translate-x-4" : "translate-x-0.5"}`} /></span>
                {category.active ? "Shown" : "Hidden"}
              </button>
              {editingId === category.id ? (
                <><FhButton size="sm" onClick={() => rename.mutate({ id: category.id, value: editingName })} disabled={rename.isPending || !editingName.trim()}>Save</FhButton><FhButton size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</FhButton></>
              ) : <FhButton size="sm" variant="outline" onClick={() => { setEditingId(category.id); setEditingName(category.name); }}>Rename</FhButton>}
              <AlertDialog>
                <AlertDialogTrigger asChild><FhButton size="sm" variant="ghost">Delete</FhButton></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Delete {category.name}?</AlertDialogTitle><AlertDialogDescription>This category can only be deleted when no products use it.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove.mutate(category.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function refresh(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminCategoriesQuery.queryKey }),
    queryClient.invalidateQueries({ queryKey: categoriesQuery.queryKey }),
  ]);
}
