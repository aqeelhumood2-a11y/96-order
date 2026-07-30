import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { InventoryReservationRepository } from "@/core/interfaces/inventory-reservation-repository";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreInventoryReservationRepository } from "@/infrastructure/firebase/repositories/firestore-inventory-reservation-repository";

export interface InventoryReservationDeps {
  reservations: InventoryReservationRepository;
  auditLogs: AuditLogRepository;
}

export const defaultInventoryReservationDeps: InventoryReservationDeps = {
  reservations: new FirestoreInventoryReservationRepository(),
  auditLogs: new FirestoreAuditLogRepository(),
};
