import { describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/core/errors";
import { listCustomers } from "@/services/customers/list-customers";
import { makeSession } from "../test-helpers";
import { createMockCustomerManagementDeps, makeCustomer } from "./test-helpers";

describe("listCustomers", () => {
  it("denies an actor without customers:view", async () => {
    const deps = createMockCustomerManagementDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(listCustomers(actor, { limit: 25 }, deps)).rejects.toThrow(ForbiddenError);
  });

  it("passes a single-word search straight through", async () => {
    const deps = createMockCustomerManagementDeps();
    const actor = makeSession({ effectivePermissions: new Set(["customers:view"]) });
    await listCustomers(actor, { limit: 25, search: "ahmed" }, deps);
    expect(deps.customers.list).toHaveBeenCalledWith(expect.objectContaining({ search: "ahmed" }));
  });

  it("refines a multi-word search in-memory", async () => {
    const deps = createMockCustomerManagementDeps();
    const matching = makeCustomer({ id: "ahmed@example.com", fullName: "Ahmed Ali" });
    const nonMatching = makeCustomer({ id: "hassan@example.com", fullName: "Ahmed Hassan" });
    deps.customers.list = vi.fn().mockResolvedValue({ items: [matching, nonMatching], nextCursor: null });

    const actor = makeSession({ effectivePermissions: new Set(["customers:view"]) });
    const page = await listCustomers(actor, { limit: 25, search: "ahmed ali" }, deps);

    expect(page.items.map((customer) => customer.id)).toEqual(["ahmed@example.com"]);
  });
});
