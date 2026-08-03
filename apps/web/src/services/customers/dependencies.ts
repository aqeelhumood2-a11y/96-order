import type { CustomerRepository } from "@/core/interfaces/customer-repository";
import type { OrderRepository } from "@/core/interfaces/order-repository";
import { FirestoreCustomerRepository } from "@/infrastructure/firebase/repositories/firestore-customer-repository";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";

export interface CustomerManagementDeps {
  customers: CustomerRepository;
  orders: OrderRepository;
}

export const defaultCustomerManagementDeps: CustomerManagementDeps = {
  customers: new FirestoreCustomerRepository(),
  orders: new FirestoreOrderRepository(),
};
