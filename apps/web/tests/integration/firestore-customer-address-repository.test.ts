import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { CustomerAddress } from "@/core/customer-address/entities";
import { FirestoreCustomerAddressRepository } from "@/infrastructure/firebase/repositories/firestore-customer-address-repository";

const repo = new FirestoreCustomerAddressRepository();

function makeAddress(customerUid: string, overrides: Partial<CustomerAddress> = {}): CustomerAddress {
  const now = new Date();
  return {
    id: randomUUID(),
    customerUid,
    label: "home",
    recipientName: "Ahmed Ali",
    recipientMobile: "+97336001234",
    address: { country: "BH", area: "Manama", block: "304", road: "1502", building: "12" },
    isDefault: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("FirestoreCustomerAddressRepository (emulator)", () => {
  it("create() then listByCustomer()/findById() round-trip the address", async () => {
    const customerUid = `customer-${randomUUID()}`;
    const address = makeAddress(customerUid);
    await repo.create(address);

    expect(await repo.findById(address.id)).toEqual(address);
    expect((await repo.listByCustomer(customerUid)).map((item) => item.id)).toContain(address.id);
  });

  it("setDefault() clears isDefault on every other address for that customer, transactionally", async () => {
    const customerUid = `customer-${randomUUID()}`;
    const first = makeAddress(customerUid, { isDefault: true });
    const second = makeAddress(customerUid);
    await repo.create(first);
    await repo.create(second);

    await repo.setDefault(customerUid, second.id);

    const addresses = await repo.listByCustomer(customerUid);
    const byId = new Map(addresses.map((address) => [address.id, address]));
    expect(byId.get(first.id)?.isDefault).toBe(false);
    expect(byId.get(second.id)?.isDefault).toBe(true);
  });

  it("setDefault() never affects another customer's addresses", async () => {
    const customerUid = `customer-${randomUUID()}`;
    const otherUid = `customer-${randomUUID()}`;
    const mine = makeAddress(customerUid);
    const theirs = makeAddress(otherUid, { isDefault: true });
    await repo.create(mine);
    await repo.create(theirs);

    await repo.setDefault(customerUid, mine.id);

    expect((await repo.findById(theirs.id))?.isDefault).toBe(true);
  });

  it("delete() removes the address", async () => {
    const customerUid = `customer-${randomUUID()}`;
    const address = makeAddress(customerUid);
    await repo.create(address);
    await repo.delete(address.id);

    expect(await repo.findById(address.id)).toBeNull();
  });
});
