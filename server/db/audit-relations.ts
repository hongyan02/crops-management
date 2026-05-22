import { sqliteClient } from "./index";

type AuditCheck = {
  name: string;
  sql: string;
  recommendation: string;
};

const checks: AuditCheck[] = [
  {
    name: "product_metrics_orphans",
    sql: `
      select count(*) as count
      from product_metrics pm
      left join products p on p.id = pm.product_id
      left join quality_metrics qm on qm.id = pm.metric_id
      where p.id is null or qm.id is null
    `,
    recommendation: "删除 product 时应阻止删除或先清理绑定指标；删除 metric 时同理。",
  },
  {
    name: "buyer_products_orphans",
    sql: `
      select count(*) as count
      from buyer_products bp
      left join buyers b on b.id = bp.buyer_id
      left join products p on p.id = bp.product_id
      where b.id is null or p.id is null
    `,
    recommendation: "buyer 与 product 的多对多关系适合最终收敛为外键 + 受控删除策略。",
  },
  {
    name: "buyer_requirements_orphans",
    sql: `
      select count(*) as count
      from buyer_requirements br
      left join buyers b on b.id = br.buyer_id
      left join products p on p.id = br.product_id
      left join quality_metrics qm on qm.id = br.metric_id
      where b.id is null or p.id is null or qm.id is null
    `,
    recommendation: "buyer requirement 依赖 buyer/product/metric 三方，迁移前必须先清空孤儿记录。",
  },
  {
    name: "supplier_products_orphans",
    sql: `
      select count(*) as count
      from supplier_products sp
      left join suppliers s on s.id = sp.supplier_id
      left join products p on p.id = sp.product_id
      where s.id is null or p.id is null
    `,
    recommendation: "supplier 与 product 的关系建议先确认删除语义，再决定是否加外键级联。",
  },
  {
    name: "supplier_quality_orphans",
    sql: `
      select count(*) as count
      from supplier_quality sq
      left join suppliers s on s.id = sq.supplier_id
      left join products p on p.id = sq.product_id
      left join quality_metrics qm on qm.id = sq.metric_id
      where s.id is null or p.id is null or qm.id is null
    `,
    recommendation: "supplier quality 更接近审计记录，通常不建议直接级联删除。",
  },
];

async function main() {
  const results = [];

  for (const check of checks) {
    const result = await sqliteClient.execute(check.sql);
    const count = Number(result.rows[0]?.count ?? 0);

    results.push({
      name: check.name,
      count,
      recommendation: check.recommendation,
    });
  }

  console.table(results);

  const totalIssues = results.reduce((sum, entry) => sum + entry.count, 0);
  if (totalIssues > 0) {
    console.log(`Found ${totalIssues} orphaned relation rows. Resolve them before adding business foreign keys.`);
    process.exitCode = 1;
    return;
  }

  console.log("No orphaned relation rows found. Foreign-key migration can be evaluated safely.");
}

main().catch((error) => {
  console.error("Failed to audit business relations.");
  console.error(error);
  process.exit(1);
});
