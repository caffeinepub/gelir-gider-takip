import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Tag,
  TrendingUp,
  Wallet,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/islemler", label: "İşlemler", icon: ArrowLeftRight },
  { path: "/kategoriler", label: "Kategoriler", icon: Tag },
  { path: "/hesaplar", label: "Hesaplar", icon: Wallet },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouterState();
  const pathname = router.location.pathname;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-card border-r border-border">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-700 text-foreground leading-tight">
              FinansApp
            </div>
            <div className="text-[10px] text-muted-foreground">
              Gelir Gider Takibi
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5" aria-label="Ana navigasyon">
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? pathname === "/"
                : pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-ocid={`nav.${item.label.toLowerCase().replace(/\s+/g, "_")}.link`}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 bg-card border-b border-border flex-shrink-0">
          <h1 className="text-sm font-semibold text-foreground">
            {navItems.find((n) =>
              n.path === "/" ? pathname === "/" : pathname.startsWith(n.path),
            )?.label ?? "FinansApp"}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
