import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { type Transaction, TransactionType } from "../backend.d";
import DeleteDialog from "../components/DeleteDialog";
import TransactionModal from "../components/TransactionModal";
import {
  useAccounts,
  useAddTransaction,
  useAllTransactions,
  useCategories,
  useDeleteTransaction,
  useUpdateTransaction,
} from "../hooks/useQueries";
import { formatCurrency, formatDate } from "../lib/formatters";

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const { data: transactions = [], isLoading } = useAllTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const addMutation = useAddTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter(
        (t) =>
          !q ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.account.toLowerCase().includes(q),
      );
  }, [transactions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const balanceMap = useMemo(() => {
    const sorted = [...transactions].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const map = new Map<bigint, number>();
    let bal = 0;
    for (const t of sorted) {
      bal +=
        t.transactionType === TransactionType.income ? t.amount : -t.amount;
      map.set(t.id, bal);
    }
    return map;
  }, [transactions]);

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("İşlem silindi.");
    } catch {
      toast.error("Silme işlemi başarısız.");
    }
    setDeleteId(null);
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="bg-card rounded-lg border border-border shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Tüm İşlemler
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} kayıt
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                className="pl-8 h-8 text-xs w-52"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                data-ocid="transactions.search_input"
              />
            </div>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => {
                setEditTx(null);
                setModalOpen(true);
              }}
              data-ocid="transactions.add.primary_button"
            >
              <Plus className="w-3.5 h-3.5" />
              Yeni İşlem Ekle
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="transactions.loading_state">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div
            className="p-12 text-center"
            data-ocid="transactions.empty_state"
          >
            <p className="text-sm text-muted-foreground">Sonuç bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">Tarih</TableHead>
                  <TableHead className="text-xs font-semibold">
                    Açıklama
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Kategori
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Hesap</TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Gelir ₺
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Gider ₺
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Bakiye ₺
                  </TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((t, idx) => {
                  const bal = balanceMap.get(t.id) ?? 0;
                  return (
                    <TableRow
                      key={String(t.id)}
                      className="text-xs hover:bg-muted/30"
                      data-ocid={`transactions.item.${idx + 1}`}
                    >
                      <TableCell className="text-muted-foreground">
                        {formatDate(t.date)}
                      </TableCell>
                      <TableCell className="font-medium max-w-48 truncate">
                        {t.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5"
                        >
                          {t.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.account}
                      </TableCell>
                      <TableCell className="text-right">
                        {t.transactionType === TransactionType.income && (
                          <span className="amount-positive">
                            {formatCurrency(t.amount)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {t.transactionType === TransactionType.expense && (
                          <span className="amount-negative">
                            {formatCurrency(t.amount)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${bal >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(bal)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditTx(t);
                              setModalOpen(true);
                            }}
                            data-ocid={`transactions.edit_button.${idx + 1}`}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(t.id)}
                            data-ocid={`transactions.delete_button.${idx + 1}`}
                            className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                data-ocid="transactions.pagination_prev"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                data-ocid="transactions.pagination_next"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTx(null);
        }}
        transaction={editTx}
        categories={categories}
        accounts={accounts}
        onAdd={async (data) => {
          await addMutation.mutateAsync(data);
        }}
        onEdit={async (id, data) => {
          await updateMutation.mutateAsync({ id, ...data });
        }}
      />
      <DeleteDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="İşlemi silmek istediğinize emin misiniz?"
        description="Bu işlem kalıcı olarak silinecektir."
      />
    </motion.div>
  );
}
