import { z } from "zod";
import { HOMEPAGE_SECTION_KEYS } from "./entities";

const footerLinkSchema = z.object({ label: z.string().trim().min(1), href: z.string().trim().min(1) });
const footerColumnSchema = z.object({ title: z.string().trim().min(1), links: z.array(footerLinkSchema) });
const socialLinkSchema = z.object({ platform: z.string().trim().min(1), url: z.string().trim().min(1) });
const navLinkItemSchema = z.object({ label: z.string().trim().min(1), href: z.string().trim().min(1) });
const homepageSectionSchema = z.object({
  key: z.enum(HOMEPAGE_SECTION_KEYS),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0),
  title: z.string().trim().min(1).nullable(),
  subtitle: z.string().trim().min(1).nullable(),
});
const paymentProviderSettingsSchema = z.object({
  tapEnabled: z.boolean(),
  cashOnDeliveryEnabled: z.boolean(),
  cashOnPickupEnabled: z.boolean(),
});

export const siteSettingsInputSchema = z.object({
  storeName: z.string().trim().min(1, "Please enter a store name.").max(200),
  logoUrl: z.string().trim().url().nullable(),
  faviconUrl: z.string().trim().url().nullable(),
  contactEmail: z.string().trim().email().or(z.literal("")),
  contactPhone: z.string().trim().max(30),
  socialLinks: z.array(socialLinkSchema),
  hoursText: z.string().trim().max(1000),
  footerColumns: z.array(footerColumnSchema),
  paymentLogos: z.array(z.string().trim().min(1)),
  shippingPolicyText: z.string().trim().max(5000),
  freeShippingThresholdText: z.string().trim().max(500),
  copyrightText: z.string().trim().max(300),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().trim().max(1000),
  hamburgerItems: z.array(navLinkItemSchema),
  showCategoryMenu: z.boolean(),
  showBrandMenu: z.boolean(),
  homepageSections: z.array(homepageSectionSchema),
  paymentProviders: paymentProviderSettingsSchema,
});
export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>;
