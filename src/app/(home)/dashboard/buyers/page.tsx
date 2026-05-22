import type { Metadata } from "next";

import { BuyersManagementView } from "@/features/buyers";

export const metadata: Metadata = {
  title: "采购商管理",
};

export default function BuyersPage() {
  return <BuyersManagementView />;
}
