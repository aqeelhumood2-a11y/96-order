import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { CustomerAddressRepository } from "@/core/interfaces/customer-address-repository";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreCustomerAddressRepository } from "@/infrastructure/firebase/repositories/firestore-customer-address-repository";

export interface CustomerAddressDeps {
  addresses: CustomerAddressRepository;
  auditLogs: AuditLogRepository;
}

export const defaultCustomerAddressDeps: CustomerAddressDeps = {
  addresses: new FirestoreCustomerAddressRepository(),
  auditLogs: new FirestoreAuditLogRepository(),
};
