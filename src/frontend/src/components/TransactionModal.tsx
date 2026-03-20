import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type Account,
  type Category,
  type Transaction,
  TransactionType,
} from "../backend.d";
import { todayInputDate } from "../lib/formatters";

export interface TransactionPayload {
  date: string;
  description: string;
  category: string;
  account: string;
  amount: number;
  transactionType: TransactionType;
}

interface Props {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  categories: Category[];
  accounts: Account[];
  onAdd: (data: TransactionPayload) => Promise<void>;
  onEdit: (id: bigint, data: TransactionPayload) => Promise<void>;
}

interface FormData {
  date: string;
  description: string;
  category: string;
  account: string;
  amount: string;
  transactionType: TransactionType;
}

const empty: FormData = {
  date: todayInputDate(),
  description: "",
  category: "",
  account: "",
  amount: "",
  transactionType: TransactionType.expense,
};

export default function TransactionModal({
  open,
  onClose,
  transaction,
  categories,
  accounts,
  onAdd,
  onEdit,
}: Props) {
  const [form, setForm] = useState<FormData>(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setForm({
        date: transaction.date,
        description: transaction.description,
        category: transaction.category,
        account: transaction.account,
        amount: String(transaction.amount),
        transactionType: transaction.transactionType,
      });
    } else {
      setForm({ ...empty, date: todayInputDate() });
    }
  }, [transaction, open]);

  const set = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.description ||
      !form.category ||
      !form.account ||
      !form.amount ||
      !form.date
    ) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }
    const amount = Number.parseFloat(form.amount.replace(",", "."));
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Geçerli bir tutar girin.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, amount };
      if (transaction) {
        await onEdit(transaction.id, payload);
        toast.success("İşlem güncellendi.");
      } else {
        await onAdd(payload);
        toast.success("İşlem eklendi.");
      }
      onClose();
    } catch {
      toast.error("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-ocid="transaction.modal">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "İşlemi Düzenle" : "Yeni İşlem Ekle"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => set("transactionType", TransactionType.income)}
              data-ocid="transaction.income.toggle"
              className={[
                "py-2.5 rounded-md text-sm font-medium border transition-colors",
                form.transactionType === TransactionType.income
                  ? "bg-green-50 border-green-400 text-green-700"
                  : "border-border text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              ↑ Gelir
            </button>
            <button
              type="button"
              onClick={() => set("transactionType", TransactionType.expense)}
              data-ocid="transaction.expense.toggle"
              className={[
                "py-2.5 rounded-md text-sm font-medium border transition-colors",
                form.transactionType === TransactionType.expense
                  ? "bg-red-50 border-red-400 text-red-700"
                  : "border-border text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              ↓ Gider
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-date">Tarih</Label>
            <Input
              id="t-date"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              data-ocid="transaction.date.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Açıklama</Label>
            <Input
              id="t-desc"
              placeholder="İşlem açıklaması"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              data-ocid="transaction.description.input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v)}
              >
                <SelectTrigger data-ocid="transaction.category.select">
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={String(c.id)} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Hesap</Label>
              <Select
                value={form.account}
                onValueChange={(v) => set("account", v)}
              >
                <SelectTrigger data-ocid="transaction.account.select">
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={String(a.id)} value={a.name}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-amount">Tutar (₺)</Label>
            <Input
              id="t-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              data-ocid="transaction.amount.input"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="transaction.cancel_button"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-ocid="transaction.submit_button"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {transaction ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
