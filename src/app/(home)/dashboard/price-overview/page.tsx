import type { Metadata } from "next";

import { PriceOverviewView } from "@/features/price-overview";

export const metadata: Metadata = {
  title: "价格看板",
};

export default function PriceOverviewPage() {
  return <PriceOverviewView />;
}
