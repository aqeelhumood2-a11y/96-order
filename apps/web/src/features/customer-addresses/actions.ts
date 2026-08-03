"use server";

import { revalidatePath } from "next/cache";
import type { CustomerAddressInput } from "@/core/customer-address/schemas";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { createMyAddress, deleteMyAddress, setDefaultMyAddress, updateMyAddress } from "@/services/customer-addresses/addresses";

export async function createAddressAction(input: CustomerAddressInput): Promise<ActionResult<{ id: string }>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    const address = await createMyAddress(session, input);
    return { id: address.id };
  });
  if (result.ok) revalidatePath("/account/addresses");
  return result;
}

export async function updateAddressAction(addressId: string, input: CustomerAddressInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    await updateMyAddress(session, addressId, input);
    return null;
  });
  if (result.ok) revalidatePath("/account/addresses");
  return result;
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    await deleteMyAddress(session, addressId);
    return null;
  });
  if (result.ok) revalidatePath("/account/addresses");
  return result;
}

export async function setDefaultAddressAction(addressId: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    await setDefaultMyAddress(session, addressId);
    return null;
  });
  if (result.ok) revalidatePath("/account/addresses");
  return result;
}
