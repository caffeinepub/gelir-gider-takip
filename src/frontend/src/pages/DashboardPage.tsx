import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Pencil,
  PiggyBank,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  useSummary,
  useUpdateTransaction,
} from "../hooks/useQueries";
import { formatCurrency, formatDate } from "../lib/formatters";

const CHART_COLORS = [
  "#2563EB",
  "#16A34A",
  "#DC2626",
  "#D97706",
  "#7C3AED",
  "#0891B2",
  "#BE185D",
];

const TR_MONTHS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {title}
          </p>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{value}</p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor}`}
        >
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

type TypeFilter = "all" | "income" | "expense";

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: transactions = [], isLoading: txLoading } =
    useAllTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const addMutation = useAddTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterType, setFilterType] = useState<TypeFilter>("all");

  const savingsRate = useMemo(() => {
    if (!summary || summary.totalIncome === 0) return 0;
    return Math.round(
      ((summary.totalIncome - summary.totalExpense) / summary.totalIncome) *
        100,
    );
  }, [summary]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        !search ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        filterCategory === "all" || t.category === filterCategory;
      const matchAcc = filterAccount === "all" || t.account === filterAccount;
      const matchType =
        filterType === "all" ||
        (filterType === "income" &&
          t.transactionType === TransactionType.income) ||
        (filterType === "expense" &&
          t.transactionType === TransactionType.expense);
      return matchSearch && matchCat && matchAcc && matchType;
    });
  }, [transactions, search, filterCategory, filterAccount, filterType]);

  const sortedByDate = useMemo(
    () => [...filtered].sort((a, b) => a.date.localeCompare(b.date)),
    [filtered],
  );

  const withBalance = useMemo(() => {
    let bal = 0;
    return sortedByDate.map((t) => {
      bal +=
        t.transactionType === TransactionType.income ? t.amount : -t.amount;
      return { ...t, runningBalance: bal };
    });
  }, [sortedByDate]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; gelir: number; gider: number }> =
      {};
    for (const t of transactions) {
      const key = t.date.substring(0, 7);
      if (!map[key]) map[key] = { month: key, gelir: 0, gider: 0 };
      if (t.transactionType === TransactionType.income)
        map[key].gelir += t.amount;
      else map[key].gider += t.amount;
    }
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((d) => {
        const [y, m] = d.month.split("-");
        return { ...d, month: `${TR_MONTHS[Number.parseInt(m) - 1]} ${y}` };
      });
  }, [transactions]);

  const expenseByCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions.filter(
      (t) => t.transactionType === TransactionType.expense,
    )) {
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const byAccount = useMemo(() => {
    const map: Record<
      string,
      { account: string; gelir: number; gider: number }
    > = {};
    for (const t of transactions) {
      if (!map[t.account])
        map[t.account] = { account: t.account, gelir: 0, gider: 0 };
      if (t.transactionType === TransactionType.income)
        map[t.account].gelir += t.amount;
      else map[t.account].gider += t.amount;
    }
    return Object.values(map);
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

  const typeFilterOptions: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "Tümü" },
    { value: "income", label: "Gelir" },
    { value: "expense", label: "Gider" },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SummaryCard
          title="Toplam Gelir"
          value={formatCurrency(summary?.totalIncome ?? 0)}
          icon={TrendingUp}
          color="text-green-600"
          bgColor="bg-green-50"
          loading={summaryLoading}
        />
        <SummaryCard
          title="Toplam Gider"
          value={formatCurrency(summary?.totalExpense ?? 0)}
          icon={TrendingDown}
          color="text-red-600"
          bgColor="bg-red-50"
          loading={summaryLoading}
        />
        <SummaryCard
          title="Mevcut Bakiye"
          value={formatCurrency(summary?.balance ?? 0)}
          icon={Wallet}
          color="text-blue-600"
          bgColor="bg-blue-50"
          loading={summaryLoading}
        />
        <SummaryCard
          title="Tasarruf Oranı"
          value={`%${savingsRate}`}
          icon={PiggyBank}
          color="text-purple-600"
          bgColor="bg-purple-50"
          loading={summaryLoading}
        />
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Aylık Gelir / Gider Trendi
          </h3>
          {monthlyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Veri yok
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gelir"
                  stroke="#16A34A"
                  strokeWidth={2}
                  dot={false}
                  name="Gelir"
                />
                <Line
                  type="monotone"
                  dataKey="gider"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={false}
                  name="Gider"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-5 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Gider Dağılımı
          </h3>
          {expenseByCat.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Veri yok
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={expenseByCat}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseByCat.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {byAccount.length > 0 && (
        <motion.div
          className="bg-card rounded-lg border border-border p-5 shadow-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Hesap Bazlı Gelir / Gider
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byAccount} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`}
              />
              <YAxis
                type="category"
                dataKey="account"
                tick={{ fontSize: 11 }}
                width={90}
              />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar
                dataKey="gelir"
                fill="#16A34A"
                name="Gelir"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="gider"
                fill="#DC2626"
                name="Gider"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <motion.div
        className="bg-card rounded-lg border border-border shadow-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Son İşlemler
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                className="pl-8 h-8 text-xs w-44"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="dashboard.search_input"
              />
            </div>
            {/* Type filter */}
            <div className="flex items-center rounded-md border border-border overflow-hidden h-8">
              {typeFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilterType(opt.value)}
                  data-ocid={`dashboard.type_${opt.value}.tab`}
                  className={`px-3 text-xs h-full transition-colors ${
                    filterType === opt.value
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger
                className="h-8 text-xs w-36"
                data-ocid="dashboard.category.select"
              >
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={String(c.id)} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger
                className="h-8 text-xs w-36"
                data-ocid="dashboard.account.select"
              >
                <SelectValue placeholder="Hesap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Hesaplar</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={String(a.id)} value={a.name}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => {
                setEditTx(null);
                setModalOpen(true);
              }}
              data-ocid="dashboard.add_transaction.primary_button"
            >
              <Plus className="w-3.5 h-3.5" />
              Yeni İşlem Ekle
            </Button>
          </div>
        </div>

        {txLoading ? (
          <div className="p-6 space-y-3" data-ocid="dashboard.loading_state">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : withBalance.length === 0 ? (
          <div className="p-12 text-center" data-ocid="dashboard.empty_state">
            <p className="text-sm text-muted-foreground">
              Henüz işlem yok. Yeni bir işlem ekleyin.
            </p>
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
                {[...withBalance].reverse().map((t, idx) => (
                  <TableRow
                    key={String(t.id)}
                    className="text-xs hover:bg-muted/30"
                    data-ocid={`dashboard.transaction.item.${idx + 1}`}
                  >
                    <TableCell className="text-muted-foreground">
                      {formatDate(t.date)}
                    </TableCell>
                    <TableCell className="font-medium max-w-48 truncate">
                      {t.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] px-1.5">
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
                      className={`text-right font-semibold ${
                        t.runningBalance >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(t.runningBalance)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditTx(t);
                            setModalOpen(true);
                          }}
                          data-ocid={`dashboard.transaction.edit_button.${idx + 1}`}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(t.id)}
                          data-ocid={`dashboard.transaction.delete_button.${idx + 1}`}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

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
    </div>
  );
}
