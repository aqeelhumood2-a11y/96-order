import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { getCustomer } from "@/services/customers/get-customer";
import { makeSession } from "../test-helpers";
import { createMockCustomerManagementDeps, makeCustomer } from "./test-helpers";

describe("getCustomer", () => {
  it("denies an actor without customers:view", async () => {
    const deps = createMockCustomerManagementDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(getCustomer(actor, "ahmed@example.com", deps)).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError for a missing customer", async () => {
    const deps = createMockCustomerManagementDeps();
    const actor = makeSession({ effectivePermissions: new Set(["customers:view"]) });
    await expect(getCustomer(actor, "ahmed@example.com", deps)).rejects.toThrow(NotFoundError);
  });

  it("returns the customer and their order history", async () => {
    const deps = createMockCustomerManagementDeps();
    const customer = makeCustomer();
    deps.customers.findById = vi.fn().mockResolvedValue(customer);
    deps.orders.listByCustomer = vi.fn().mockResolvedValue([]);
    const actor = makeSession({ effectivePermissions: new Set(["customers:view"]) });

    const detail = await getCustomer(actor, "ahmed@example.com", deps);
    expect(detail.customer).toBe(customer);
    expect(deps.orders.listByCustomer).toHaveBeenCalledWith("ahmed@example.com", expect.any(Number));
  });
});
