import { randomUUID } from "node:crypto";
import { isValidDeliveryAddress } from "@/core/delivery/rules";
import type { CustomerAddress } from "@/core/customer-address/entities";
import { customerAddressInputSchema, type CustomerAddressInput } from "@/core/customer-address/schemas";
import type { CustomerSession } from "@/core/customer-auth/entities";
import { NotFoundError, ValidationError } from "@/core/errors";
import { defaultCustomerAddressDeps, type CustomerAddressDeps } from "./dependencies";

async function requireOwnedAddress(session: CustomerSession, addressId: string, deps: CustomerAddressDeps): Promise<CustomerAddress> {
  const address = await deps.addresses.findById(addressId);
  if (!address) {
    throw new NotFoundError("Address not found.");
  }
  if (address.customerUid !== session.uid) {
    // A `NotFoundError`, not `ForbiddenError` — never confirm to a caller that an address id belonging to someone else exists at all.
    throw new NotFoundError("Address not found.");
  }
  return address;
}

export async function listMyAddresses(session: CustomerSession, deps: CustomerAddressDeps = defaultCustomerAddressDeps): Promise<CustomerAddress[]> {
  return deps.addresses.listByCustomer(session.uid);
}

export async function createMyAddress(session: CustomerSession, input: CustomerAddressInput, deps: CustomerAddressDeps = defaultCustomerAddressDeps): Promise<CustomerAddress> {
  const parsed = customerAddressInputSchema.parse(input);
  if (!isValidDeliveryAddress(parsed.address)) {
    throw new ValidationError("Please provide a complete, supported address.");
  }

  const now = new Date();
  const address: CustomerAddress = {
    id: randomUUID(),
    customerUid: session.uid,
    label: parsed.label,
    customLabel: parsed.label === "custom" ? parsed.customLabel : undefined,
    recipientName: parsed.recipientName,
    recipientMobile: parsed.recipientMobile,
    address: parsed.address,
    isDefault: parsed.isDefault,
    createdAt: now,
    updatedAt: now,
  };
  await deps.addresses.create(address);
  if (parsed.isDefault) {
    await deps.addresses.setDefault(session.uid, address.id);
  }

  await deps.auditLogs.record({ type: "customer_address_created", actorUid: session.uid, actorEmail: session.email, metadata: { addressId: address.id } });
  return address;
}

export async function updateMyAddress(session: CustomerSession, addressId: string, input: CustomerAddressInput, deps: CustomerAddressDeps = defaultCustomerAddressDeps): Promise<void> {
  await requireOwnedAddress(session, addressId, deps);
  const parsed = customerAddressInputSchema.parse(input);
  if (!isValidDeliveryAddress(parsed.address)) {
    throw new ValidationError("Please provide a complete, supported address.");
  }

  await deps.addresses.update(addressId, {
    label: parsed.label,
    customLabel: parsed.label === "custom" ? parsed.customLabel : undefined,
    recipientName: parsed.recipientName,
    recipientMobile: parsed.recipientMobile,
    address: parsed.address,
  });
  if (parsed.isDefault) {
    await deps.addresses.setDefault(session.uid, addressId);
  }

  await deps.auditLogs.record({ type: "customer_address_updated", actorUid: session.uid, actorEmail: session.email, metadata: { addressId } });
}

export async function deleteMyAddress(session: CustomerSession, addressId: string, deps: CustomerAddressDeps = defaultCustomerAddressDeps): Promise<void> {
  await requireOwnedAddress(session, addressId, deps);
  await deps.addresses.delete(addressId);
  await deps.auditLogs.record({ type: "customer_address_deleted", actorUid: session.uid, actorEmail: session.email, metadata: { addressId } });
}

export async function setDefaultMyAddress(session: CustomerSession, addressId: string, deps: CustomerAddressDeps = defaultCustomerAddressDeps): Promise<void> {
  await requireOwnedAddress(session, addressId, deps);
  await deps.addresses.setDefault(session.uid, addressId);
}
