import { ForbiddenError } from "@/core/errors";
import { ReportsFilters } from "@/features/admin-reports/components/reports-filters";
import { SalesReportTable } from "@/features/admin-reports/components/sales-report-table";
import { BestSellersTable } from "@/features/admin-reports/components/best-sellers-table";
import { OrdersByStatusTable } from "@/features/admin-reports/components/orders-by-status-table";
import { CashPaymentsSummaryCard } from "@/features/admin-reports/components/cash-payments-summary-card";
import { OnlinePaymentsSummaryCard } from "@/features/admin-reports/components/online-payments-summary-card";
import { PendingCashCollectionTable } from "@/features/admin-reports/components/pending-cash-collection-table";
import { parseReportsSearchParams } from "@/features/admin-reports/parse-search-params";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getBestSellingProducts } from "@/services/reports/best-selling-products";
import { getOrdersByStatusReport } from "@/services/reports/orders-by-status";
import { getCashPaymentsReport, getOnlinePaymentsReport, getPendingCashCollectionReport } from "@/services/reports/payments-report";
import { getDailySalesReport, getMonthlySalesReport, getWeeklySalesReport } from "@/services/reports/sales-report";
import { requireSession } from "@/services/auth/session";

interface ReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const BEST_SELLERS_LIMIT = 20;

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);
  const raw = await searchParams;
  const query = parseReportsSearchParams(raw);

  const getSalesReport = query.period === "week" ? getWeeklySalesReport : query.period === "month" ? getMonthlySalesReport : getDailySalesReport;

  let data;
  try {
    const [sales, bestSellers, ordersByStatus, cashPayments, onlinePayments, pendingCashCollection] = await Promise.all([
      getSalesReport(session, query.from, query.to),
      getBestSellingProducts(session, query.from, query.to, BEST_SELLERS_LIMIT),
      getOrdersByStatusReport(session, query.from, query.to),
      getCashPaymentsReport(session, query.from, query.to),
      getOnlinePaymentsReport(session, query.from, query.to),
      getPendingCashCollectionReport(session),
    ]);
    data = { sales, bestSellers, ordersByStatus, cashPayments, onlinePayments, pendingCashCollection };
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!data) {
    return <p className="text-sm text-foreground/70">{getDictionary(locale).admin.noPermissionPage}</p>;
  }

  const dict = getDictionary(locale).admin.reportsPage;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>
      <ReportsFilters query={query} locale={locale} />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-brand-950">{dict.sales}</h2>
        <SalesReportTable buckets={data.sales} locale={locale} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-brand-950">{dict.bestSellingProducts}</h2>
          <BestSellersTable products={data.bestSellers} locale={locale} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-brand-950">{dict.ordersByStatus}</h2>
          <OrdersByStatusTable rows={data.ordersByStatus} locale={locale} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-brand-950">{dict.cashPayments}</h2>
          <CashPaymentsSummaryCard summary={data.cashPayments} locale={locale} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-brand-950">{dict.onlinePayments}</h2>
          <OnlinePaymentsSummaryCard summary={data.onlinePayments} locale={locale} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-brand-950">{dict.pendingCashCollection}</h2>
        <PendingCashCollectionTable rows={data.pendingCashCollection} locale={locale} />
      </div>
    </div>
  );
}
