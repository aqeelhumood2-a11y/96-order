import type { Permission } from "./permissions";

export type StaffUserStatus = "active" | "deactivated";

export interface StaffUser {
  uid: string;
  email: string;
  displayName?: string;
  status: StaffUserStatus;
  roleIds: string[];
  directPermissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastLoginAt?: Date;
  deactivatedAt?: Date;
  deactivatedBy?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export const AUDIT_LOG_EVENT_TYPES = [
  "login_success",
  "login_failure",
  "logout",
  "password_reset_requested",
  "staff_created",
  "staff_activated",
  "staff_deactivated",
  "staff_role_changed",
  "role_created",
  "role_updated",
  "permissions_changed",
  "session_revoked",
  "bootstrap_completed",
  // Phase 3 (catalog and inventory foundation)
  "product_created",
  "product_updated",
  "product_archived",
  "category_created",
  "category_updated",
  "category_deleted",
  "brand_created",
  "brand_updated",
  "brand_deleted",
  "product_image_uploaded",
  "product_image_deleted",
  "inventory_adjusted",
  // Phase 5 (cart, checkout, delivery, pickup, payments, and order creation)
  "cart_checkout_started",
  "order_created",
  "order_cancelled",
  "inventory_reserved",
  "inventory_reservation_released",
  "payment_started",
  "payment_succeeded",
  "payment_failed",
  "payment_webhook_received",
  "cash_payment_confirmed",
  // Phase 6 (order management, customers, inventory operations, admin dashboard)
  "order_status_changed",
  "order_payment_confirmed",
  "inventory_reservation_expired",
  "inventory_manual_correction",
  "customer_created",
  "customer_updated",
  // Phase 7 (customer accounts, CMS, wishlist, reviews, promotions)
  "customer_registered",
  "customer_logged_in",
  "customer_logged_out",
  "customer_password_reset_requested",
  "customer_profile_updated",
  "customer_address_created",
  "customer_address_updated",
  "customer_address_deleted",
  "guest_orders_linked",
  "wishlist_item_added",
  "wishlist_item_removed",
  "back_in_stock_subscribed",
  "back_in_stock_unsubscribed",
  "back_in_stock_notification_sent",
  "review_created",
  "review_updated",
  "review_deleted",
  "review_moderated",
  "product_question_created",
  "product_question_answered",
  "coupon_created",
  "coupon_updated",
  "coupon_redeemed",
  "promotion_created",
  "promotion_updated",
  "cms_page_created",
  "cms_page_updated",
  "cms_page_published",
  "site_settings_updated",
  "customer_data_export_requested",
  "customer_data_deletion_requested",
] as const;

export type AuditLogEventType = (typeof AUDIT_LOG_EVENT_TYPES)[number];

export interface AuditLogEntry {
  id: string;
  type: AuditLogEventType;
  actorUid: string | null;
  actorEmail?: string;
  targetUid?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/** A new entry to be recorded — `id`/`createdAt` are assigned by the repository. */
export type NewAuditLogEntry = Omit<AuditLogEntry, "id" | "createdAt">;

/**
 * The authenticated principal for the current request, resolved from a
 * verified session cookie plus the corresponding `users/{uid}` document
 * (and its roles). Never constructed from unverified client input.
 */
export interface Session {
  uid: string;
  email: string;
  roleIds: string[];
  effectivePermissions: ReadonlySet<Permission>;
}
