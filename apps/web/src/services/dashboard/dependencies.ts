import type { InventoryRepository } from "@/core/interfaces/inventory-repository";
import type { OrderRepository } from "@/core/interfaces/order-repository";
import type { ReportRepository } from "@/core/interfaces/report-repository";
import { FirestoreInventoryRepository } from "@/infrastructure/firebase/repositories/firestore-inventory-repository";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";
import { FirestoreReportRepository } from "@/infrastructure/firebase/repositories/firestore-report-repository";

export interface DashboardDeps {
  reports: ReportRepository;
  inventory: InventoryRepository;
  orders: OrderRepository;
}

export const defaultDashboardDeps: DashboardDeps = {
  reports: new FirestoreReportRepository(),
  inventory: new FirestoreInventoryRepository(),
  orders: new FirestoreOrderRepository(),
};
