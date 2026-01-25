export interface ProductListItem {
  id: string;
  name: string;
  category?: string;
  unit: string;
  minStock: number;
  currentStock: number;
  image?: string | null;
  refIds: string[];
  machineName: string;
}

export interface ProductForm {
  name: string;
  category: string;
  unit: string;
  minStock: number | string;
  image?: string | null;
  refIds: string[];
  machineName: string;
}
