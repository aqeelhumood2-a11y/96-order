import Link from "next/link";
import type { Customer } from "@/core/customer/entities";
import { formatMoney } from "@/core/money/money";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

export function CustomersTable({ customers, locale = DEFAULT_LOCALE }: { customers: Customer[]; locale?: Locale }) {
  const dict = getDictionary(locale).admin.customersPage;

  if (customers.length === 0) {
    return <p className="text-sm text-foreground/69">{dict.noCustomers}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-brand-100">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-brand-100 bg-brand-50/50 text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">{dict.table.name}</th>
            <th className="px-4 py-3 font-medium">{dict.table.contact}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.table.orders}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.table.totalSpent}</th>
            <th className="px-4 py-3 font-medium">{dict.table.lastOrder}</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/30">
              <td className="px-4 py-3">
                <Link href={`/admin/customers/${encodeURIComponent(customer.id)}`} className="font-medium text-brand-900 hover:underline">
                  {customer.fullName}
                </Link>
                {customer.companyName && <div className="text-xs text-foreground/65">{customer.companyName}</div>}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-foreground">{customer.email}</span>
                  <span className="text-xs text-foreground/65">{customer.mobile}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right">{customer.totalOrders}</td>
              <td className="px-4 py-3 text-right font-medium text-foreground">{formatMoney(customer.totalSpent)}</td>
              <td className="px-4 py-3 text-foreground/70">{formatDate(customer.lastOrderAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
