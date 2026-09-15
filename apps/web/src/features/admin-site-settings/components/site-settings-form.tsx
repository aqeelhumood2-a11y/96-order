"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HomepageSectionConfig, PaymentProviderSettings, SiteSettings } from "@/core/site-settings/entities";
import type { SiteSettingsInput } from "@/core/site-settings/schemas";
import { updateSiteSettingsAction } from "@/features/admin-site-settings/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button, Input, Label, Textarea } from "@/ui/primitives";

/** Parses a `label|href` per-line textarea into `NavLinkItem[]`/`FooterLink[]` — the pragmatic "structured, not a visual builder" editor described in `core/site-settings/entities.ts`'s doc comment. */
function parseLinkLines(value: string): { label: string; href: string }[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|").map((part) => part.trim());
      return { label: label ?? "", href: href ?? "" };
    })
    .filter((link) => link.label && link.href);
}

function formatLinkLines(links: readonly { label: string; href: string }[]): string {
  return links.map((link) => `${link.label}|${link.href}`).join("\n");
}

function parseListLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function SiteSettingsForm({ settings, locale = DEFAULT_LOCALE }: { settings: SiteSettings; locale?: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale).admin.siteSettingsForm;
  const SECTION_LABELS: Record<HomepageSectionConfig["key"], string> = {
    hero: dict.sectionHero,
    featured: dict.sectionFeatured,
    new_arrivals: dict.sectionNewArrivals,
    coffee: dict.sectionCoffee,
    equipment: dict.sectionEquipment,
    brands: dict.sectionBrands,
  };
  const [storeName, setStoreName] = useState(settings.storeName);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl ?? "");
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl ?? "");
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [contactPhone, setContactPhone] = useState(settings.contactPhone);
  const [hoursText, setHoursText] = useState(settings.hoursText);
  const [shippingPolicyText, setShippingPolicyText] = useState(settings.shippingPolicyText);
  const [freeShippingThresholdText, setFreeShippingThresholdText] = useState(settings.freeShippingThresholdText);
  const [copyrightText, setCopyrightText] = useState(settings.copyrightText);
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode);
  const [maintenanceMessage, setMaintenanceMessage] = useState(settings.maintenanceMessage);
  const [showCategoryMenu, setShowCategoryMenu] = useState(settings.showCategoryMenu);
  const [showBrandMenu, setShowBrandMenu] = useState(settings.showBrandMenu);
  const [showFeaturedMenu, setShowFeaturedMenu] = useState(settings.showFeaturedMenu);
  const [showNewArrivalsMenu, setShowNewArrivalsMenu] = useState(settings.showNewArrivalsMenu);
  const [hamburgerItemsText, setHamburgerItemsText] = useState(formatLinkLines(settings.hamburgerItems));
  const [socialLinksText, setSocialLinksText] = useState(formatLinkLines(settings.socialLinks.map((link) => ({ label: link.platform, href: link.url }))));
  const [paymentLogosText, setPaymentLogosText] = useState(settings.paymentLogos.join("\n"));
  const [footerColumnsJson, setFooterColumnsJson] = useState(JSON.stringify(settings.footerColumns, null, 2));
  const [sections, setSections] = useState<HomepageSectionConfig[]>(settings.homepageSections);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProviderSettings>(settings.paymentProviders);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateSection(key: HomepageSectionConfig["key"], patch: Partial<HomepageSectionConfig>) {
    setSections((current) => current.map((section) => (section.key === key ? { ...section, ...patch } : section)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    let footerColumns: SiteSettingsInput["footerColumns"];
    try {
      footerColumns = JSON.parse(footerColumnsJson || "[]");
    } catch {
      setError(dict.footerColumnsInvalidJson);
      return;
    }

    setIsSubmitting(true);
    try {
      const input: SiteSettingsInput = {
        storeName,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        contactEmail,
        contactPhone,
        socialLinks: parseLinkLines(socialLinksText).map((link) => ({ platform: link.label, url: link.href })),
        hoursText,
        footerColumns,
        paymentLogos: parseListLines(paymentLogosText),
        shippingPolicyText,
        freeShippingThresholdText,
        copyrightText,
        maintenanceMode,
        maintenanceMessage,
        hamburgerItems: parseLinkLines(hamburgerItemsText),
        showCategoryMenu,
        showBrandMenu,
        showFeaturedMenu,
        showNewArrivalsMenu,
        homepageSections: sections,
        paymentProviders,
      };
      const result = await updateSiteSettingsAction(input);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-3xl flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-lg font-semibold text-brand-950">{dict.storeIdentity}</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{dict.storeName}</Label>
            <Input value={storeName} onChange={(event) => setStoreName(event.target.value)} disabled={isSubmitting} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{dict.contactEmail}</Label>
            <Input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{dict.contactPhone}</Label>
            <Input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} disabled={isSubmitting} />
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-lg font-semibold text-brand-950">{dict.paymentProviders}</legend>
        <p className="text-xs text-foreground/65">{dict.paymentProvidersHint}</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={paymentProviders.tapEnabled}
              onChange={(event) => setPaymentProviders((current) => ({ ...current, tapEnabled: event.target.checked }))}
              disabled={isSubmitting}
            />
            {dict.tapEnabled}
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={paymentProviders.cashOnDeliveryEnabled}
              onChange={(event) => setPaymentProviders((current) => ({ ...current, cashOnDeliveryEnabled: event.target.checked }))}
              disabled={isSubmitting}
            />
            {dict.cashOnDelivery}
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={paymentProviders.cashOnPickupEnabled}
              onChange={(event) => setPaymentProviders((current) => ({ ...current, cashOnPickupEnabled: event.target.checked }))}
              disabled={isSubmitting}
            />
            {dict.cashOnPickup}
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-lg font-semibold text-brand-950">{dict.maintenanceMode}</legend>
        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" checked={maintenanceMode} onChange={(event) => setMaintenanceMode(event.target.checked)} disabled={isSubmitting} />
          {dict.maintenanceEnabled}
        </label>
        <Input value={maintenanceMessage} onChange={(event) => setMaintenanceMessage(event.target.value)} disabled={isSubmitting} placeholder={dict.maintenanceMessage} />
      </fieldset>

      <details className="group rounded-lg border border-surface-border bg-background p-6">
        <summary className="cursor-pointer text-sm font-medium text-brand-800 select-none">{dict.advancedOptions}</summary>

        <div className="mt-6 flex flex-col gap-8">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold text-brand-950">{dict.storeIdentity}</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{dict.copyrightText}</Label>
                <Input value={copyrightText} onChange={(event) => setCopyrightText(event.target.value)} disabled={isSubmitting} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{dict.logoUrl}</Label>
                <Input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} disabled={isSubmitting} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{dict.faviconUrl}</Label>
                <Input value={faviconUrl} onChange={(event) => setFaviconUrl(event.target.value)} disabled={isSubmitting} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.hours}</Label>
              <Textarea value={hoursText} onChange={(event) => setHoursText(event.target.value)} disabled={isSubmitting} rows={2} />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold text-brand-950">{dict.policiesAndShipping}</legend>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.shippingPolicyText}</Label>
              <Textarea value={shippingPolicyText} onChange={(event) => setShippingPolicyText(event.target.value)} disabled={isSubmitting} rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.freeShippingThresholdText}</Label>
              <Input value={freeShippingThresholdText} onChange={(event) => setFreeShippingThresholdText(event.target.value)} disabled={isSubmitting} />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold text-brand-950">{dict.navigationAndFooter}</legend>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.headerLinks}</Label>
              <Textarea value={hamburgerItemsText} onChange={(event) => setHamburgerItemsText(event.target.value)} disabled={isSubmitting} rows={6} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.socialLinks}</Label>
              <Textarea value={socialLinksText} onChange={(event) => setSocialLinksText(event.target.value)} disabled={isSubmitting} rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.paymentLogos}</Label>
              <Textarea value={paymentLogosText} onChange={(event) => setPaymentLogosText(event.target.value)} disabled={isSubmitting} rows={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.footerColumnsJson}</Label>
              <Textarea value={footerColumnsJson} onChange={(event) => setFooterColumnsJson(event.target.value)} disabled={isSubmitting} rows={6} className="font-mono text-xs" />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground/80">
                <input type="checkbox" checked={showCategoryMenu} onChange={(event) => setShowCategoryMenu(event.target.checked)} disabled={isSubmitting} />
                {dict.showCategoryMenu}
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground/80">
                <input type="checkbox" checked={showBrandMenu} onChange={(event) => setShowBrandMenu(event.target.checked)} disabled={isSubmitting} />
                {dict.showBrandMenu}
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground/80">
                <input type="checkbox" checked={showFeaturedMenu} onChange={(event) => setShowFeaturedMenu(event.target.checked)} disabled={isSubmitting} />
                {dict.showFeaturedMenu}
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground/80">
                <input type="checkbox" checked={showNewArrivalsMenu} onChange={(event) => setShowNewArrivalsMenu(event.target.checked)} disabled={isSubmitting} />
                {dict.showNewArrivalsMenu}
              </label>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold text-brand-950">{dict.homepageSections}</legend>
            {sections.map((section) => (
              <div key={section.key} className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-3 rounded-md border border-brand-100 p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
                  <input type="checkbox" checked={section.visible} onChange={(event) => updateSection(section.key, { visible: event.target.checked })} disabled={isSubmitting} />
                  {SECTION_LABELS[section.key]}
                </label>
                <Input
                  value={section.title ?? ""}
                  placeholder={dict.titleOverride}
                  onChange={(event) => updateSection(section.key, { title: event.target.value || null })}
                  disabled={isSubmitting}
                />
                <Input
                  type="number"
                  value={section.sortOrder}
                  onChange={(event) => updateSection(section.key, { sortOrder: Number(event.target.value) })}
                  disabled={isSubmitting}
                  min={0}
                  className="w-20"
                />
                <Input
                  value={section.subtitle ?? ""}
                  placeholder={dict.subtitleOverride}
                  onChange={(event) => updateSection(section.key, { subtitle: event.target.value || null })}
                  disabled={isSubmitting}
                />
              </div>
            ))}
          </fieldset>
        </div>
      </details>

      {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? dict.saving : dict.saveSettings}
      </Button>
    </form>
  );
}
