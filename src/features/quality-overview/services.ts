import { API_SERVICE } from "@/config/api";
import { getWithMeta } from "@/lib/request";

import type { QualityOverviewListData, QualityOverviewListParams } from "./types";

export async function listQualityOverview(params: QualityOverviewListParams = {}) {
  return getWithMeta<QualityOverviewListData>(API_SERVICE.qualityOverview.list, {
    params,
  });
}
