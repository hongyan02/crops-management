import type { Metadata } from "next";

import { ProductsManagementView } from "@/features/products";

export const metadata: Metadata = {
  title: "基础信息",
};

export default function ProductsPage() {
  return <ProductsManagementView />;
}
