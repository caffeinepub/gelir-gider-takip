import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Wallet } from "lucide-react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TransactionType } from "../backend.d";
import DeleteDialog from "../components/DeleteDialog";
import {
  useAccounts,
  useAddAccount,
  useAllTransactions,
  useDeleteAccount,
} from "../hooks/useQueries";
import { formatCurrency } from "../lib/formatters";

export default function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: transactions = [] } = useAllTransactions();
  const addMutation = useAddAccount();
  const deleteMutation = useDeleteAccount();

  const [newName, setNewName] = useState("");
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const accountStats = useMemo(() => {
    const map: Record<string, { balance: number; count: number }> = {};
    for (const t of transactions) {
      if (!map[t.account]) map[t.account] = { balance: 0, count: 0 };
      map[t.account].count += 1;
      if (t.transactionType === TransactionType.income) {
        map[t.account].balance += t.amount;
      } else {
        map[t.account].balance -= t.amount;
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
      toast.success("Hesap eklendi.");
    } catch {
      toast.error("Hesap eklenemedi.");
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Hesap silindi.");
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
          Yeni Hesap Ekle
        </h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder="Hesap adı"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="text-sm"
            data-ocid="accounts.name.input"
          />
          <Button
            type="submit"
            disabled={addMutation.isPending}
            data-ocid="accounts.add.primary_button"
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
          <h2 className="text-sm font-semibold text-foreground">Hesaplar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {accounts.length} hesap
          </p>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2" data-ocid="accounts.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-10 text-center" data-ocid="accounts.empty_state">
            <Wallet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Henüz hesap yok.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {accounts.map((a, idx) => {
              const stats = accountStats[a.name] ?? { balance: 0, count: 0 };
              return (
                <li
                  key={String(a.id)}
                  className="flex items-center justify-between px-5 py-3"
                  data-ocid={`accounts.item.${idx + 1}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-indigo-50 flex items-center justify-center shrink-0">
                      <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground block">
                        {a.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {stats.count} işlem
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`text-sm font-semibold ${
                          stats.balance >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(stats.balance)}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        bakiye
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteId(a.id)}
                      data-ocid={`accounts.delete_button.${idx + 1}`}
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
        title="Hesabı silmek istediğinize emin misiniz?"
        description="Bu hesap kalıcı olarak silinecektir."
      />
    </motion.div>
  );
}
