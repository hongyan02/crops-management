import type { Metadata } from "next";

import { QualityOverviewView } from "@/features/quality-overview";

export const metadata: Metadata = {
  title: "产品质量",
};

export default function QualityOverviewPage() {
  return <QualityOverviewView />;
}
