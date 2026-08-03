import { ForbiddenError } from "@/core/errors";
import { ReportsFilters } from "@/features/admin-reports/components/reports-filters";
import { SalesReportTable } from "@/features/admin-reports/components/sales-report-table";
import { BestSellersTable } from "@/features/admin-reports/components/best-sellers-table";
import { OrdersByStatusTable } from "@/features/admin-reports/components/orders-by-status-table";
import { parseReportsSearchParams } from "@/features/admin-reports/parse-search-params";
import { getBestSellingProducts } from "@/services/reports/best-selling-products";
import { getOrdersByStatusReport } from "@/services/reports/orders-by-status";
import { getDailySalesReport, getMonthlySalesReport, getWeeklySalesReport } from "@/services/reports/sales-report";
import { requireSession } from "@/services/auth/session";

interface ReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const BEST_SELLERS_LIMIT = 20;

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await requireSession();
  const raw = await searchParams;
  const query = parseReportsSearchParams(raw);

  const getSalesReport = query.period === "week" ? getWeeklySalesReport : query.period === "month" ? getMonthlySalesReport : getDailySalesReport;

  let data;
  try {
    const [sales, bestSellers, ordersByStatus] = await Promise.all([
      getSalesReport(session, query.from, query.to),
      getBestSellingProducts(session, query.from, query.to, BEST_SELLERS_LIMIT),
      getOrdersByStatusReport(session, query.from, query.to),
    ]);
    data = { sales, bestSellers, ordersByStatus };
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!data) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Reports</h1>
      <ReportsFilters query={query} />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-brand-950">Sales</h2>
        <SalesReportTable buckets={data.sales} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-brand-950">Best selling products</h2>
          <BestSellersTable products={data.bestSellers} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-brand-950">Orders by status</h2>
          <OrdersByStatusTable rows={data.ordersByStatus} />
        </div>
      </div>
    </div>
  );
}
