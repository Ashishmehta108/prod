import React from "react";
import {
  HashRouter, // Changed from BrowserRouter
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import StockOut from "./pages/StockOut";
import StockIn from "./pages/StockIn";
import Dashboard from "./pages/Dashboard";
import WeightEntry from "./pages/Weight";
import { SearchProvider } from "./context/SearchContext";
import ProductAddForm from "./pages/AddProduct";
import UsersPage from "./pages/AdminPage";
import TallySync from "./pages/tally/TallySync";
import TallyVouchers from "./pages/tally/TallyVouchers";
import TallySettings from "./pages/tally/TallySettings";
import WeightHistory from "./pages/WeightHistory";
import LowStockProducts from "./pages/LowStockProducts";
import StockSummary from "./pages/StockSummary";
import StockInRecords from "./pages/StockInRecords";
import StockOutRecords from "./pages/StockOutRecords";
import Categories from "./pages/Categories";
import { Toaster } from "sonner";

const AppContent: React.FC = () => {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Map route paths to page IDs for sidebar
  const getPageFromPath = (pathname: string): string => {
    if (pathname.startsWith("/products/") && !pathname.endsWith("/add")) {
      // Product detail
      return "products-all";
    }
    if (pathname === "/products") return "products-all";
    if (pathname === "/products/add") return "products-add";
    if (pathname === "/products/categories") return "products-categories";
    if (pathname === "/stock-in") return "stock-in";
    if (pathname === "/stock-out") return "stock-out";
    if (pathname === "/weight") return "weight";
    if (pathname === "/weight/history") return "weight-history";
    if (pathname === "/tally/sync") return "tally-sync";
    if (pathname === "/tally/vouchers") return "tally-vouchers";
    if (pathname === "/tally/settings") return "tally-settings";
    if (pathname === "/user") return "user";
    if (pathname === "/low-stock") return "low-stock";
    if (pathname === "/stock-summary") return "stock-summary";
    if (pathname === "/stock-in-records") return "stock-in-records";
    if (pathname === "/stock-out-records") return "stock-out-records";
    return "dashboard";
  };

  const handlePageChange = (page: string) => {
    const routes: Record<string, string> = {
      dashboard: "/",
      products: "/products",
      "products-all": "/products",
      "products-add": "/products/add",
      "products-categories": "/products/categories",
      "stock-in": "/stock-in",
      "stock-out": "/stock-out",
      weight: "/weight",
      "weight-history": "/weight/history",
      "tally-sync": "/tally/sync",
      "tally-vouchers": "/tally/vouchers",
      "tally-settings": "/tally/settings",
      user: "/user",
      "low-stock": "/low-stock",
      "stock-summary": "/stock-summary",
      "stock-in-records": "/stock-in-records",
      "stock-out-records": "/stock-out-records",
    };
    navigate(routes[page] || "/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    //@ts-ignore
    return <Login onLoginSuccess={login} />;
  }

  return (
    <SearchProvider>
      <Layout currentPage={getPageFromPath(location.pathname)} onChangePage={handlePageChange}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/add" element={<ProductAddForm />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/stock-in" element={<StockIn />} />
          <Route path="/stock-out" element={<StockOut />} />
          <Route path="/weight" element={<WeightEntry />} />
          <Route path="/weight/history" element={<WeightHistory />} />
          <Route path="/tally/sync" element={<TallySync />} />
          <Route path="/tally/vouchers" element={<TallyVouchers />} />
          <Route path="/tally/settings" element={<TallySettings />} />
          <Route path="/user" element={<UsersPage />} />
          <Route path="/low-stock" element={<LowStockProducts />} />
          <Route path="/stock-summary" element={<StockSummary />} />
          <Route path="/stock-in-records" element={<StockInRecords />} />
          <Route path="/stock-out-records" element={<StockOutRecords />} />
          <Route path="/products/categories" element={<Categories />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </SearchProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Toaster position="top-right" closeButton />
      <HashRouter> {/* Changed from BrowserRouter */}
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;