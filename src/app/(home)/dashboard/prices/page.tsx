import type { Metadata } from "next";

import { PricesManagementView } from "@/features/prices";

export const metadata: Metadata = {
  title: "价格管理",
};

export default function PricesPage() {
  return <PricesManagementView />;
}
