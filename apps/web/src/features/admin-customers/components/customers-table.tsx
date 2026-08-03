import Link from "next/link";
import type { Customer } from "@/core/customer/entities";
import { formatMoney } from "@/core/money/money";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

export function CustomersTable({ customers }: { customers: Customer[] }) {
  if (customers.length === 0) {
    return <p className="text-sm text-foreground/69">No customers match these filters.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-brand-100">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-brand-100 bg-brand-50/50 text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 text-right font-medium">Orders</th>
            <th className="px-4 py-3 text-right font-medium">Total spent</th>
            <th className="px-4 py-3 font-medium">Last order</th>
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
