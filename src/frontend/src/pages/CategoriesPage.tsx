import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Tag, Trash2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TransactionType } from "../backend.d";
import DeleteDialog from "../components/DeleteDialog";
import {
  useAddCategory,
  useAllTransactions,
  useCategories,
  useDeleteCategory,
} from "../hooks/useQueries";
import { formatCurrency } from "../lib/formatters";

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const { data: transactions = [] } = useAllTransactions();
  const addMutation = useAddCategory();
  const deleteMutation = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const categoryStats = useMemo(() => {
    const map: Record<
      string,
      { income: number; expense: number; count: number }
    > = {};
    for (const t of transactions) {
      if (!map[t.category])
        map[t.category] = { income: 0, expense: 0, count: 0 };
      map[t.category].count += 1;
      if (t.transactionType === TransactionType.income) {
        map[t.category].income += t.amount;
      } else {
        map[t.category].expense += t.amount;
      }
    }
    return map;
  }, [transactions]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      await addMutation.mutateAsync(name);
      setNewName("");
      toast.success("Kategori eklendi.");
    } catch {
      toast.error("Kategori eklenemedi.");
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Kategori silindi.");
    } catch {
      toast.error("Silme işlemi başarısız.");
    }
    setDeleteId(null);
  };

  return (
    <motion.div
      className="max-w-xl space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="bg-card rounded-lg border border-border shadow-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Yeni Kategori Ekle
        </h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder="Kategori adı"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="text-sm"
            data-ocid="categories.name.input"
          />
          <Button
            type="submit"
            disabled={addMutation.isPending}
            data-ocid="categories.add.primary_button"
          >
            {addMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Ekle
          </Button>
        </form>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Kategoriler</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {categories.length} kategori
          </p>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2" data-ocid="categories.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center" data-ocid="categories.empty_state">
            <Tag className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Henüz kategori yok.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((c, idx) => {
              const stats = categoryStats[c.name] ?? {
                income: 0,
                expense: 0,
                count: 0,
              };
              return (
                <li
                  key={String(c.id)}
                  className="flex items-center justify-between px-5 py-3"
                  data-ocid={`categories.item.${idx + 1}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground block">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {stats.count} işlem
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-0.5">
                      {stats.expense > 0 && (
                        <span className="text-xs font-semibold text-red-600">
                          -{formatCurrency(stats.expense)}
                        </span>
                      )}
                      {stats.income > 0 && (
                        <span className="text-xs font-semibold text-green-600">
                          +{formatCurrency(stats.income)}
                        </span>
                      )}
                      {stats.count === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteId(c.id)}
                      data-ocid={`categories.delete_button.${idx + 1}`}
                      className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <DeleteDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Kategoriyi silmek istediğinize emin misiniz?"
        description="Bu kategori kalıcı olarak silinecektir."
      />
    </motion.div>
  );
}
