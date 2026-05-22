import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsDataTable } from "@/features/quality-metrics/components/metrics-data-table";

import { ProductsDataTable } from "./components/products-data-table";

export function ProductsManagementView() {
  return (
    <Tabs defaultValue="products">
      <TabsList>
        <TabsTrigger value="products">产品</TabsTrigger>
        <TabsTrigger value="metrics">指标定义</TabsTrigger>
      </TabsList>
      <TabsContent value="products">
        <ProductsDataTable />
      </TabsContent>
      <TabsContent value="metrics">
        <MetricsDataTable />
      </TabsContent>
    </Tabs>
  );
}
