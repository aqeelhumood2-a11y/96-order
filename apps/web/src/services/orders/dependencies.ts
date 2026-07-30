import type { OrderRepository } from "@/core/interfaces/order-repository";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";

export interface OrderTrackingDeps {
  orders: OrderRepository;
}

export const defaultOrderTrackingDeps: OrderTrackingDeps = {
  orders: new FirestoreOrderRepository(),
};
