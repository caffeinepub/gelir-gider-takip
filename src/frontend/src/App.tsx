import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import { useInitialize } from "./hooks/useQueries";
import AccountsPage from "./pages/AccountsPage";
import CategoriesPage from "./pages/CategoriesPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";

function AppRoot() {
  useInitialize();
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const rootRoute = createRootRoute({
  component: AppRoot,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/islemler",
  component: TransactionsPage,
});

const categoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kategoriler",
  component: CategoriesPage,
});

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hesaplar",
  component: AccountsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  transactionsRoute,
  categoriesRoute,
  accountsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
