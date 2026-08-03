import { AddressesList } from "@/features/customer-addresses/components/addresses-list";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { listMyAddresses } from "@/services/customer-addresses/addresses";

export default async function AccountAddressesPage() {
  const session = await requireCustomerSession();
  const addresses = await listMyAddresses(session);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Saved addresses</h1>
      <AddressesList addresses={addresses} />
    </div>
  );
}
