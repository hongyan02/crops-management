import type { Metadata } from "next";

import { SuppliersManagementView } from "@/features/suppliers";

export const metadata: Metadata = {
  title: "供应商管理",
};

export default function SuppliersPage() {
  return <SuppliersManagementView />;
}
