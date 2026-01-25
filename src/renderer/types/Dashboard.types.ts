export interface DashboardProductSummary {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
}

export interface DashboardData {
  totalProducts: number;
  lowStockCount: number;
  products: DashboardProductSummary[];
}

export interface Product {
  id: string;
  name: string;
  minStock: number;
  currentStock: number;
}
export interface StockData {
  products: Product[];
}
