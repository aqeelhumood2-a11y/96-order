import { z } from "zod";

export const registerCustomerSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(200),
  email: z.string().trim().email("Please enter a valid email address.").max(320),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
  marketingConsent: z.boolean().default(false),
});
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;

export const loginCustomerSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1),
});
export type LoginCustomerInput = z.infer<typeof loginCustomerSchema>;

export const requestPasswordResetSchema = z.object({ email: z.string().trim().email().max(320) });
export type RequestCustomerPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const updateCustomerProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  mobile: z.string().trim().max(20).optional(),
});
export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;

export const notificationPreferencesSchema = z.object({
  orderUpdates: z.boolean(),
  backInStock: z.boolean(),
  promotions: z.boolean(),
  questionAnswered: z.boolean(),
  reviewStatusChanges: z.boolean(),
});
export type UpdateNotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

export const marketingConsentSchema = z.object({ marketingConsent: z.boolean() });
export type UpdateMarketingConsentInput = z.infer<typeof marketingConsentSchema>;
