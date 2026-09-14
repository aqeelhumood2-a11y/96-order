import type { Locale } from "./locale-types";

/**
 * Hand-typed nested objects rather than a string-keyed `t("a.b.c")` lookup —
 * a typo in a key path here is a TypeScript error, not a silent blank string
 * at runtime. Every `Dictionary` consumer gets full autocomplete and a
 * compile error the moment `en`/`ar` drift out of shape with each other.
 *
 * Scope: the storefront shell (header/nav/footer/search) and the admin
 * nav + Products/Categories screens — the flows this pass's language
 * toggle was built and verified against. Everything else in the app still
 * renders in English regardless of locale; see the redesign report for the
 * full list of what's translated vs. queued as a follow-up pass using this
 * same dictionary.
 */
export interface Dictionary {
  languageSwitcher: {
    label: string;
  };
  nav: {
    shop: string;
    search: string;
    searchPlaceholder: string;
    searchLabel: string;
    openMenu: string;
    closeMenu: string;
    menu: string;
    primary: string;
    mobile: string;
    cart: string;
    /** `{count}` is replaced with the item count. */
    cartWithCount: string;
    account: string;
    signIn: string;
  };
  footer: {
    shop: string;
    shopAll: string;
    policies: string;
    contact: string;
  };
  product: {
    addToCart: string;
    adding: string;
    addedToCart: string;
    wishlistAdd: string;
    wishlistRemove: string;
    quantity: string;
    inStock: string;
    outOfStock: string;
  };
  admin: {
    dashboard: string;
    catalog: string;
    products: string;
    categories: string;
    brands: string;
    inventory: string;
    sales: string;
    orders: string;
    customers: string;
    marketing: string;
    promotions: string;
    coupons: string;
    reviews: string;
    questions: string;
    content: string;
    cms: string;
    siteSettings: string;
    insights: string;
    reports: string;
    aiAssistant: string;
    system: string;
    staff: string;
    roles: string;
    integrations: string;
    notifications: string;
    signOut: string;
    productsPage: {
      heading: string;
      addProduct: string;
      status: string;
      allStatuses: string;
      filter: string;
      clear: string;
      edit: string;
      archive: string;
      noProducts: string;
      noProductsHint: string;
    };
    productForm: {
      essentials: string;
      name: string;
      productImage: string;
      productImagePlaceholder: string;
      priceBhd: string;
      category: string;
      selectCategory: string;
      stockQuantity: string;
      active: string;
      advancedOptions: string;
      createProduct: string;
      saveChanges: string;
      saving: string;
      stock: string;
    };
    categoriesPage: {
      heading: string;
    };
    categoryForm: {
      name: string;
      active: string;
      advancedOptions: string;
      createCategory: string;
      saveChanges: string;
    };
    orderStatus: Record<"pending_payment" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled", string>;
    paymentStatus: Record<"pending" | "authorized" | "paid" | "failed" | "cancelled" | "refunded" | "cash_pending" | "cash_confirmed", string>;
    ordersPage: {
      heading: string;
      noOrders: string;
      search: string;
      searchPlaceholder: string;
      status: string;
      allStatuses: string;
      advancedFilters: string;
      paymentStatus: string;
      allPaymentStatuses: string;
      fulfillment: string;
      both: string;
      delivery: string;
      pickup: string;
      dateFrom: string;
      dateTo: string;
      sortBy: string;
      sortDate: string;
      sortTotal: string;
      sortOrderNumber: string;
      direction: string;
      newestFirst: string;
      oldestFirst: string;
      applyFilters: string;
      table: { order: string; customer: string; fulfillment: string; status: string; payment: string; total: string; placed: string };
    };
    orderDetail: {
      backToOrders: string;
      noPermission: string;
      actions: {
        heading: string;
        confirmCashPayment: string;
        confirming: string;
        confirmPayment: string;
        working: string;
        releaseReservation: string;
        releasing: string;
        cancelOrder: string;
        cancelling: string;
        cancelReasonPrompt: string;
        noPermission: string;
        markDelivered: string;
        statusAction: Record<"pending_payment" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled", string>;
      };
      customerInfo: { title: string; name: string; mobile: string; email: string; company: string; note: string };
      paymentInfo: { title: string; method: string; cash: string; card: string; status: string; subtotal: string; delivery: string; discount: string; grandTotal: string };
      fulfillmentInfo: {
        deliveryTitle: string;
        pickupTitle: string;
        date: string;
        timeWindow: string;
        address: string;
        flat: string;
        landmark: string;
        instructions: string;
        location: string;
      };
      items: { title: string; item: string; sku: string; qty: string; unitPrice: string; lineTotal: string };
      reservationStatus: { title: string; product: string; qty: string; status: string; expires: string; reserved: string; committed: string; released: string; none: string };
      timeline: { title: string; createdAs: string; none: string };
    };
    customersPage: {
      heading: string;
      noCustomers: string;
      search: string;
      searchPlaceholder: string;
      applyFilters: string;
      table: { name: string; contact: string; orders: string; totalSpent: string; lastOrder: string };
    };
    customerDetail: {
      backToCustomers: string;
      totalOrders: string;
      totalSpent: string;
      firstOrder: string;
      lastOrder: string;
      contactInfo: { title: string; email: string; mobile: string; company: string; accountType: string; guest: string; registered: string };
      orderHistory: string;
    };
    discountType: Record<"percentage" | "fixed" | "free_shipping", string>;
    couponForm: {
      code: string;
      type: string;
      description: string;
      percentageValue: string;
      fixedValue: string;
      categoryIds: string;
      brandIds: string;
      excludedProductIds: string;
      excludedCategoryIds: string;
      minSubtotal: string;
      maxDiscountCap: string;
      usageLimit: string;
      perCustomerLimit: string;
      startsAt: string;
      endsAt: string;
      active: string;
      firstOrderOnly: string;
      stackable: string;
      advancedOptions: string;
      createCoupon: string;
      saveChanges: string;
      saving: string;
    };
    couponsPage: {
      heading: string;
      /** `{value}` replaced */
      percentOff: string;
      /** `{amount}` replaced */
      amountOff: string;
      freeDelivery: string;
      /** `{count}` replaced */
      used: string;
      active: string;
      inactive: string;
      edit: string;
      deactivate: string;
      activate: string;
      newCoupon: string;
    };
    promotionForm: {
      name: string;
      type: string;
      percentageValue: string;
      fixedValue: string;
      categoryIds: string;
      brandIds: string;
      startsAt: string;
      endsAt: string;
      priority: string;
      active: string;
      stackable: string;
      advancedOptions: string;
      createPromotion: string;
      saveChanges: string;
      saving: string;
    };
    promotionsPage: {
      heading: string;
      /** `{value}` replaced */
      percentOff: string;
      /** `{value}` replaced */
      amountOff: string;
      freeDelivery: string;
      /** `{priority}` replaced */
      priority: string;
      stackable: string;
      exclusive: string;
      active: string;
      inactive: string;
      edit: string;
      deactivate: string;
      activate: string;
      newPromotion: string;
    };
    staffPage: {
      heading: string;
      addStaffAccount: string;
      noStaff: string;
      table: { email: string; roles: string; status: string; actions: string };
      statusActive: string;
      statusDeactivated: string;
      deactivate: string;
      activate: string;
      forceLogout: string;
      resetPassword: string;
      passwordResetSent: string;
    };
    createStaffForm: {
      email: string;
      displayName: string;
      roles: string;
      noRoles: string;
      creating: string;
      createAccount: string;
      /** `{email}` replaced */
      successMessage: string;
    };
    rolesPage: {
      heading: string;
      createRole: string;
      noRoles: string;
      table: { name: string; description: string; permissions: string; actions: string };
      system: string;
      delete: string;
    };
    roleForm: {
      roleId: string;
      name: string;
      description: string;
      permissions: string;
      namespace: string;
      creating: string;
      createRole: string;
    };
    siteSettingsPage: { heading: string };
    siteSettingsForm: {
      storeIdentity: string;
      storeName: string;
      contactEmail: string;
      contactPhone: string;
      paymentProviders: string;
      paymentProvidersHint: string;
      tapEnabled: string;
      cashOnDelivery: string;
      cashOnPickup: string;
      maintenanceMode: string;
      maintenanceEnabled: string;
      maintenanceMessage: string;
      advancedOptions: string;
      copyrightText: string;
      logoUrl: string;
      faviconUrl: string;
      hours: string;
      policiesAndShipping: string;
      shippingPolicyText: string;
      freeShippingThresholdText: string;
      navigationAndFooter: string;
      headerLinks: string;
      socialLinks: string;
      paymentLogos: string;
      footerColumnsJson: string;
      showCategoryMenu: string;
      showBrandMenu: string;
      homepageSections: string;
      titleOverride: string;
      subtitleOverride: string;
      sectionHero: string;
      sectionFeatured: string;
      sectionNewArrivals: string;
      sectionCoffee: string;
      sectionEquipment: string;
      sectionBrands: string;
      footerColumnsInvalidJson: string;
      saving: string;
      saveSettings: string;
    };
    cmsPagesPage: {
      heading: string;
      newPage: string;
      editPage: string;
      noPages: string;
      table: { title: string; slug: string; status: string; nav: string; footer: string };
      yes: string;
      deleting: string;
      delete: string;
    };
    cmsPageForm: {
      title: string;
      slug: string;
      content: string;
      seoTitle: string;
      seoDescription: string;
      status: string;
      statusDraft: string;
      statusPublished: string;
      sortOrder: string;
      showInNav: string;
      showInFooter: string;
      saving: string;
      saveChanges: string;
      createPage: string;
    };
    reportsPage: {
      heading: string;
      from: string;
      to: string;
      salesBucketedBy: string;
      day: string;
      week: string;
      month: string;
      apply: string;
      sales: string;
      bestSellingProducts: string;
      ordersByStatus: string;
      cashPayments: string;
      onlinePayments: string;
      pendingCashCollection: string;
      noDataInRange: string;
      noSalesInRange: string;
      noPendingCash: string;
      salesTable: { period: string; orders: string; revenue: string };
      bestSellersTable: { product: string; sku: string; qtySold: string; revenue: string };
      ordersByStatusTable: { status: string; orders: string };
      cashSummary: {
        cashStatus: string;
        orders: string;
        total: string;
        pendingCollection: string;
        confirmed: string;
        /** `{delivery}` and `{pickup}` replaced */
        deliveryPickupSummary: string;
      };
      onlineSummary: { status: string; orders: string; total: string };
      pendingCashTable: { order: string; customer: string; fulfillment: string; amount: string; placed: string };
    };
    reviewStatus: Record<"pending" | "approved" | "rejected" | "hidden", string>;
    reviewsPage: {
      heading: string;
      all: string;
      noReviews: string;
      verifiedPurchase: string;
      product: string;
      approve: string;
      reject: string;
      hide: string;
    };
    questionStatus: Record<"pending" | "approved" | "rejected", string>;
    questionsPage: {
      heading: string;
      all: string;
      noQuestions: string;
      product: string;
      answerLabel: string;
      answerPrefix: string;
      answer: string;
      reject: string;
    };
    brandsPage: {
      heading: string;
      /** `{name}` replaced */
      editBrand: string;
      createBrand: string;
      cancelEdit: string;
      noBrands: string;
      inactive: string;
      edit: string;
      deleting: string;
      delete: string;
    };
    brandForm: {
      name: string;
      slug: string;
      description: string;
      website: string;
      active: string;
      saving: string;
      saveChanges: string;
      createBrand: string;
      brandUpdated: string;
      /** `{name}` replaced */
      brandCreated: string;
    };
    inventoryPage: {
      heading: string;
      noInventory: string;
      onHand: string;
      reserved: string;
      available: string;
      lowStock: string;
    };
    adjustInventoryForm: {
      reason: string;
      quantityChange: string;
      note: string;
      apply: string;
      applying: string;
      invalidQuantity: string;
      /** `{onHand}` and `{onHandBefore}` replaced */
      updated: string;
    };
    integrationsPage: {
      heading: string;
      subheading: string;
      providersTitle: string;
      tapPayments: string;
      transactionalEmail: string;
      aiAssistant: string;
      systemTitle: string;
      jobApiAccess: string;
      configured: string;
      notConfigured: string;
      schedulerNote: string;
      emailRetryTitle: string;
      emailRetryDescription: string;
      emailRetryButton: string;
      notificationRetryTitle: string;
      notificationRetryDescription: string;
      notificationRetryButton: string;
      retrying: string;
      /** `{attempted}`, `{succeeded}`, `{stillFailing}` replaced */
      retryResult: string;
    };
    backInStockPage: {
      heading: string;
      noSubscriptions: string;
      table: { email: string; product: string; variant: string; status: string; subscribed: string; notified: string };
      statusPending: string;
      statusNotified: string;
      statusCancelled: string;
    };
    aiAssistantPage: {
      heading: string;
      subheading: string;
      askLabel: string;
      askPlaceholder: string;
      asking: string;
      ask: string;
      aiGenerated: string;
      storeDataSnapshot: string;
      exampleQuestions: [string, string, string];
    };
    dashboardPage: {
      heading: string;
      signedInAs: string;
      noPermission: string;
      totalOrders: string;
      revenue: string;
      /** `{available}` and `{reserved}` replaced */
      inventoryAvailability: string;
      lowStock: string;
      outOfStock: string;
      nothingLow: string;
      nothingOut: string;
      viewInventory: string;
      topSellingProducts: string;
      noSalesRecent: string;
      /** `{qty}` and `{revenue}` replaced */
      soldSummary: string;
      recentOrders: string;
    };
    productImages: {
      heading: string;
      noImages: string;
      noAltText: string;
      primary: string;
      delete: string;
      deleting: string;
      setAsPrimary: string;
      imageUrlLabel: string;
      imageUrlPlaceholder: string;
      imageUrlHint: string;
      addFromUrl: string;
      addingFromUrl: string;
      enterUrlFirst: string;
    };
  };
}

export const en: Dictionary = {
  languageSwitcher: { label: "Language" },
  nav: {
    shop: "Shop",
    search: "Search",
    searchPlaceholder: "Search coffee, brewers, brands…",
    searchLabel: "Search products",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menu: "Menu",
    primary: "Primary",
    mobile: "Mobile",
    cart: "Cart",
    cartWithCount: "Cart, {count} item(s)",
    account: "My Account",
    signIn: "Sign in",
  },
  footer: {
    shop: "Shop",
    shopAll: "Shop all",
    policies: "Policies",
    contact: "Contact",
  },
  product: {
    addToCart: "Add to cart",
    adding: "Adding…",
    addedToCart: "Added to cart.",
    wishlistAdd: "Add to wishlist",
    wishlistRemove: "Remove from wishlist",
    quantity: "Quantity",
    inStock: "In stock",
    outOfStock: "Out of stock",
  },
  admin: {
    dashboard: "Dashboard",
    catalog: "Catalog",
    products: "Products",
    categories: "Categories",
    brands: "Brands",
    inventory: "Inventory",
    sales: "Sales",
    orders: "Orders",
    customers: "Customers",
    marketing: "Marketing",
    promotions: "Promotions",
    coupons: "Coupons",
    reviews: "Reviews",
    questions: "Questions",
    content: "Content",
    cms: "CMS",
    siteSettings: "Site Settings",
    insights: "Insights",
    reports: "Reports",
    aiAssistant: "AI Assistant",
    system: "System",
    staff: "Staff",
    roles: "Roles",
    integrations: "Integrations",
    notifications: "Notifications",
    signOut: "Sign out",
    productsPage: {
      heading: "Products",
      addProduct: "Add product",
      status: "Status",
      allStatuses: "All statuses",
      filter: "Filter",
      clear: "Clear",
      edit: "Edit",
      archive: "Archive",
      noProducts: "No products yet",
      noProductsHint: "Products you add will show up here.",
    },
    productForm: {
      essentials: "Essentials",
      name: "Name",
      productImage: "Product image URL or Google Drive file ID (optional)",
      productImagePlaceholder: "https://… or a Drive file ID",
      priceBhd: "Price (BHD)",
      category: "Category",
      selectCategory: "Select a category",
      stockQuantity: "Stock quantity",
      active: "Active (visible on the storefront)",
      advancedOptions: "Advanced options",
      createProduct: "Create product",
      saveChanges: "Save changes",
      saving: "Saving…",
      stock: "Stock",
    },
    categoriesPage: {
      heading: "Categories",
    },
    categoryForm: {
      name: "Name",
      active: "Active (visible on the storefront)",
      advancedOptions: "Advanced options",
      createCategory: "Create category",
      saveChanges: "Save changes",
    },
    orderStatus: {
      pending_payment: "Pending payment",
      confirmed: "Confirmed",
      preparing: "Preparing",
      ready: "Ready",
      out_for_delivery: "Out for delivery",
      completed: "Completed",
      cancelled: "Cancelled",
    },
    paymentStatus: {
      pending: "Pending",
      authorized: "Authorized",
      paid: "Paid",
      failed: "Failed",
      cancelled: "Cancelled",
      refunded: "Refunded",
      cash_pending: "Cash on delivery/pickup",
      cash_confirmed: "Cash confirmed",
    },
    ordersPage: {
      heading: "Orders",
      noOrders: "No orders match these filters.",
      search: "Search",
      searchPlaceholder: "Order #, name, phone, or email",
      status: "Status",
      allStatuses: "All statuses",
      advancedFilters: "Advanced filters",
      paymentStatus: "Payment status",
      allPaymentStatuses: "All payment statuses",
      fulfillment: "Delivery/Pickup",
      both: "Both",
      delivery: "Delivery",
      pickup: "Pickup",
      dateFrom: "From",
      dateTo: "To",
      sortBy: "Sort by",
      sortDate: "Date",
      sortTotal: "Total",
      sortOrderNumber: "Order #",
      direction: "Direction",
      newestFirst: "Newest first",
      oldestFirst: "Oldest first",
      applyFilters: "Apply filters",
      table: { order: "Order", customer: "Customer", fulfillment: "Fulfillment", status: "Status", payment: "Payment", total: "Total", placed: "Placed" },
    },
    orderDetail: {
      backToOrders: "Orders",
      noPermission: "You don't have permission to act on this order.",
      actions: {
        heading: "Actions",
        confirmCashPayment: "Confirm cash payment",
        confirming: "Confirming…",
        confirmPayment: "Confirm payment",
        working: "Working…",
        releaseReservation: "Release reservation",
        releasing: "Releasing…",
        cancelOrder: "Cancel order",
        cancelling: "Cancelling…",
        cancelReasonPrompt: "Reason for cancelling this order (optional):",
        noPermission: "You don't have permission to act on this order.",
        markDelivered: "Mark delivered",
        statusAction: {
          pending_payment: "Move to pending payment",
          confirmed: "Confirm order",
          preparing: "Mark preparing",
          ready: "Mark ready",
          out_for_delivery: "Mark out for delivery",
          completed: "Complete order",
          cancelled: "Cancel order",
        },
      },
      customerInfo: { title: "Customer information", name: "Name", mobile: "Mobile", email: "Email", company: "Company", note: "Note" },
      paymentInfo: {
        title: "Payment information",
        method: "Method",
        cash: "Cash",
        card: "Card (Tap)",
        status: "Status",
        subtotal: "Subtotal",
        delivery: "Delivery",
        discount: "Discount",
        grandTotal: "Grand total",
      },
      fulfillmentInfo: {
        deliveryTitle: "Delivery information",
        pickupTitle: "Pickup information",
        date: "Date",
        timeWindow: "Time window",
        address: "Address",
        flat: "Flat",
        landmark: "Landmark",
        instructions: "Instructions",
        location: "Location",
      },
      items: { title: "Items", item: "Item", sku: "SKU", qty: "Qty", unitPrice: "Unit price", lineTotal: "Line total" },
      reservationStatus: {
        title: "Inventory reservation status",
        product: "Product",
        qty: "Qty",
        status: "Status",
        expires: "Expires",
        reserved: "Reserved",
        committed: "Committed",
        released: "Released",
        none: "No inventory was reserved for this order (untracked items only).",
      },
      timeline: { title: "Status timeline & audit history", createdAs: "Created as", none: "No status history yet." },
    },
    customersPage: {
      heading: "Customers",
      noCustomers: "No customers match these filters.",
      search: "Search",
      searchPlaceholder: "Name, phone, or email",
      applyFilters: "Apply filters",
      table: { name: "Name", contact: "Contact", orders: "Orders", totalSpent: "Total spent", lastOrder: "Last order" },
    },
    customerDetail: {
      backToCustomers: "Customers",
      totalOrders: "Total orders",
      totalSpent: "Total spent",
      firstOrder: "First order",
      lastOrder: "Last order",
      contactInfo: {
        title: "Contact information",
        email: "Email",
        mobile: "Mobile",
        company: "Company",
        accountType: "Account type",
        guest: "Guest checkout",
        registered: "Registered account",
      },
      orderHistory: "Order history",
    },
    discountType: { percentage: "Percentage", fixed: "Fixed amount", free_shipping: "Free delivery" },
    couponForm: {
      code: "Code",
      type: "Type",
      description: "Description",
      percentageValue: "Percentage (1-100)",
      fixedValue: "Fixed amount (fils)",
      categoryIds: "Category ids (comma-separated)",
      brandIds: "Brand ids (comma-separated)",
      excludedProductIds: "Excluded product ids",
      excludedCategoryIds: "Excluded category ids",
      minSubtotal: "Minimum subtotal (fils, 0 = none)",
      maxDiscountCap: "Max discount cap (fils, 0 = none)",
      usageLimit: "Usage limit (0 = unlimited)",
      perCustomerLimit: "Per-customer limit (0 = unlimited)",
      startsAt: "Starts at",
      endsAt: "Ends at",
      active: "Active",
      firstOrderOnly: "First order only",
      stackable: "Stackable with promotions",
      advancedOptions: "Advanced options",
      createCoupon: "Create coupon",
      saveChanges: "Save changes",
      saving: "Saving…",
    },
    couponsPage: {
      heading: "Coupons",
      percentOff: "{value}% off",
      amountOff: "{amount} off",
      freeDelivery: "Free delivery",
      used: "used {count}",
      active: "active",
      inactive: "inactive",
      edit: "Edit",
      deactivate: "Deactivate",
      activate: "Activate",
      newCoupon: "New coupon",
    },
    promotionForm: {
      name: "Name",
      type: "Type",
      percentageValue: "Percentage (1-100)",
      fixedValue: "Fixed amount (fils)",
      categoryIds: "Category ids (comma-separated, empty = store-wide)",
      brandIds: "Brand ids (comma-separated)",
      startsAt: "Starts at",
      endsAt: "Ends at",
      priority: "Priority (lower wins when non-stackable)",
      active: "Active",
      stackable: "Stackable with other promotions",
      advancedOptions: "Advanced options",
      createPromotion: "Create promotion",
      saveChanges: "Save changes",
      saving: "Saving…",
    },
    promotionsPage: {
      heading: "Promotions",
      percentOff: "{value}% off",
      amountOff: "{value} fils off",
      freeDelivery: "Free delivery",
      priority: "priority {priority}",
      stackable: "stackable",
      exclusive: "exclusive",
      active: "active",
      inactive: "inactive",
      edit: "Edit",
      deactivate: "Deactivate",
      activate: "Activate",
      newPromotion: "New promotion",
    },
    staffPage: {
      heading: "Staff",
      addStaffAccount: "Add staff account",
      noStaff: "No staff accounts yet.",
      table: { email: "Email", roles: "Roles", status: "Status", actions: "Actions" },
      statusActive: "active",
      statusDeactivated: "deactivated",
      deactivate: "Deactivate",
      activate: "Activate",
      forceLogout: "Force logout",
      resetPassword: "Reset password",
      passwordResetSent: "Password reset email sent.",
    },
    createStaffForm: {
      email: "Email",
      displayName: "Display name (optional)",
      roles: "Roles",
      noRoles: "No roles exist yet.",
      creating: "Creating…",
      createAccount: "Create staff account",
      successMessage: "Staff account created for {email}. A password-setup email has been sent.",
    },
    rolesPage: {
      heading: "Roles",
      createRole: "Create role",
      noRoles: "No roles yet.",
      table: { name: "Name", description: "Description", permissions: "Permissions", actions: "Actions" },
      system: "system",
      delete: "Delete",
    },
    roleForm: {
      roleId: "Role id",
      name: "Name",
      description: "Description",
      permissions: "Permissions",
      namespace: "Namespace",
      creating: "Creating…",
      createRole: "Create role",
    },
    siteSettingsPage: { heading: "Site settings" },
    siteSettingsForm: {
      storeIdentity: "Store identity",
      storeName: "Store name",
      contactEmail: "Contact email",
      contactPhone: "Contact phone",
      paymentProviders: "Payment providers",
      paymentProvidersHint: "Turn a provider off to hide it at checkout immediately — existing orders are unaffected.",
      tapEnabled: "Card payments (Tap)",
      cashOnDelivery: "Cash on delivery",
      cashOnPickup: "Cash on pickup",
      maintenanceMode: "Maintenance mode",
      maintenanceEnabled: "Enabled (shows a banner on every storefront page)",
      maintenanceMessage: "Maintenance message",
      advancedOptions: "Advanced options",
      copyrightText: "Copyright text",
      logoUrl: "Logo URL",
      faviconUrl: "Favicon URL",
      hours: "Hours",
      policiesAndShipping: "Policies & shipping",
      shippingPolicyText: "Shipping policy text",
      freeShippingThresholdText: "Free-shipping threshold text (display copy only)",
      navigationAndFooter: "Navigation & footer",
      headerLinks: "Header links (one per line, `Label|/href`)",
      socialLinks: "Social links (one per line, `Platform|https://…`)",
      paymentLogos: "Payment logos (one label per line)",
      footerColumnsJson: "Footer columns (JSON: [{title, links:[{label,href}]}])",
      showCategoryMenu: "Show category menu",
      showBrandMenu: "Show brand menu",
      homepageSections: "Homepage sections",
      titleOverride: "Title override",
      subtitleOverride: "Subtitle override",
      sectionHero: "Hero banner",
      sectionFeatured: "Featured products",
      sectionNewArrivals: "New arrivals",
      sectionCoffee: "Coffee",
      sectionEquipment: "Equipment",
      sectionBrands: "Best-selling brands",
      footerColumnsInvalidJson: "Footer columns must be valid JSON.",
      saving: "Saving…",
      saveSettings: "Save settings",
    },
    cmsPagesPage: {
      heading: "CMS pages",
      newPage: "New page",
      editPage: "Edit page",
      noPages: "No pages yet.",
      table: { title: "Title", slug: "Slug", status: "Status", nav: "Nav", footer: "Footer" },
      yes: "Yes",
      deleting: "Deleting…",
      delete: "Delete",
    },
    cmsPageForm: {
      title: "Title",
      slug: "Slug (optional — derived from the title if left blank)",
      content: "Content",
      seoTitle: "SEO title",
      seoDescription: "SEO description",
      status: "Status",
      statusDraft: "Draft",
      statusPublished: "Published",
      sortOrder: "Sort order",
      showInNav: "Show in header navigation",
      showInFooter: "Show in footer",
      saving: "Saving…",
      saveChanges: "Save changes",
      createPage: "Create page",
    },
    reportsPage: {
      heading: "Reports",
      from: "From",
      to: "To",
      salesBucketedBy: "Sales bucketed by",
      day: "Day",
      week: "Week",
      month: "Month",
      apply: "Apply",
      sales: "Sales",
      bestSellingProducts: "Best selling products",
      ordersByStatus: "Orders by status",
      cashPayments: "Cash payments",
      onlinePayments: "Online payments (Tap)",
      pendingCashCollection: "Pending cash collection",
      noDataInRange: "No data in this range.",
      noSalesInRange: "No sales in this range.",
      noPendingCash: "No cash payments are waiting to be collected.",
      salesTable: { period: "Period", orders: "Orders", revenue: "Revenue" },
      bestSellersTable: { product: "Product", sku: "SKU", qtySold: "Qty sold", revenue: "Revenue" },
      ordersByStatusTable: { status: "Status", orders: "Orders" },
      cashSummary: {
        cashStatus: "Cash status",
        orders: "Orders",
        total: "Total",
        pendingCollection: "Pending collection",
        confirmed: "Confirmed",
        deliveryPickupSummary: "{delivery} on delivery, {pickup} on pickup.",
      },
      onlineSummary: { status: "Online payment status", orders: "Orders", total: "Total" },
      pendingCashTable: { order: "Order", customer: "Customer", fulfillment: "Fulfillment", amount: "Amount", placed: "Placed" },
    },
    reviewStatus: { pending: "Pending", approved: "Approved", rejected: "Rejected", hidden: "Hidden" },
    reviewsPage: {
      heading: "Reviews",
      all: "All",
      noReviews: "No reviews yet.",
      verifiedPurchase: "Verified purchase",
      product: "product",
      approve: "Approve",
      reject: "Reject",
      hide: "Hide",
    },
    questionStatus: { pending: "Pending", approved: "Approved", rejected: "Rejected" },
    questionsPage: {
      heading: "Product questions",
      all: "All",
      noQuestions: "No questions yet.",
      product: "product",
      answerLabel: "Answer",
      answerPrefix: "A:",
      answer: "Answer",
      reject: "Reject",
    },
    brandsPage: {
      heading: "Brands",
      editBrand: 'Edit "{name}"',
      createBrand: "Create brand",
      cancelEdit: "Cancel edit",
      noBrands: "No brands yet.",
      inactive: "(inactive)",
      edit: "Edit",
      deleting: "Deleting…",
      delete: "Delete",
    },
    brandForm: {
      name: "Name",
      slug: "Slug (optional — derived from name if left blank)",
      description: "Description",
      website: "Website",
      active: "Active",
      saving: "Saving…",
      saveChanges: "Save changes",
      createBrand: "Create brand",
      brandUpdated: "Brand updated.",
      brandCreated: 'Brand "{name}" created.',
    },
    inventoryPage: {
      heading: "Inventory",
      noInventory: "No tracked inventory yet.",
      onHand: "On hand",
      reserved: "Reserved",
      available: "Available",
      lowStock: "Low stock",
    },
    adjustInventoryForm: {
      reason: "Reason",
      quantityChange: "Quantity change",
      note: "Note (optional)",
      apply: "Apply",
      applying: "Applying…",
      invalidQuantity: "Enter a non-zero whole number (negative to remove stock).",
      updated: "Updated: on-hand is now {onHand} (was {onHandBefore}).",
    },
    integrationsPage: {
      heading: "Integrations",
      subheading: "Payment providers, AI assistant, and external system access.",
      providersTitle: "Payment, email & AI providers",
      tapPayments: "Tap Payments (card checkout)",
      transactionalEmail: "Transactional email (SMTP)",
      aiAssistant: "AI Admin Assistant",
      systemTitle: "System & ERP integration",
      jobApiAccess: "Job/integration API access",
      configured: "Configured",
      notConfigured: "Not configured",
      schedulerNote: "When configured, an external scheduler can call these job endpoints, and an ERP/inventory system can poll the order sync endpoint — all authenticated with the job secret.",
      emailRetryTitle: "Email retry queue",
      emailRetryDescription: "Manually drain failed transactional emails now, instead of waiting for the next scheduled run.",
      emailRetryButton: "Retry failed emails now",
      notificationRetryTitle: "Back-in-stock notification retry queue",
      notificationRetryDescription: "Manually drain failed back-in-stock notification emails now, instead of waiting for the next scheduled run.",
      notificationRetryButton: "Retry failed notifications now",
      retrying: "Retrying…",
      retryResult: "Retried {attempted}: {succeeded} sent, {stillFailing} still failing.",
    },
    backInStockPage: {
      heading: "Back-in-stock subscriptions",
      noSubscriptions: "No back-in-stock subscriptions yet.",
      table: { email: "Email", product: "Product", variant: "Variant", status: "Status", subscribed: "Subscribed", notified: "Notified" },
      statusPending: "Pending",
      statusNotified: "Notified",
      statusCancelled: "Cancelled",
    },
    aiAssistantPage: {
      heading: "AI Admin Assistant",
      subheading: "Ask questions about orders, payments, and cash collection. Answers are read-only and based only on your store's own report data.",
      askLabel: "Ask about your store",
      askPlaceholder: "e.g. Which orders are still waiting on cash collection?",
      asking: "Asking…",
      ask: "Ask",
      aiGenerated: "AI-generated",
      storeDataSnapshot: "Store data snapshot",
      exampleQuestions: [
        "How much cash is still waiting to be collected?",
        "How are online payments trending?",
        "What's our order status breakdown?",
      ],
    },
    dashboardPage: {
      heading: "Dashboard",
      signedInAs: "Signed in as {email}.",
      noPermission: "You don't have permission to view the dashboard.",
      totalOrders: "Total orders",
      revenue: "Revenue",
      inventoryAvailability: "{available} available ({reserved} reserved)",
      lowStock: "Low stock",
      outOfStock: "Out of stock",
      nothingLow: "Nothing is running low.",
      nothingOut: "Nothing is out of stock.",
      viewInventory: "View inventory →",
      topSellingProducts: "Top selling products (last 30 days)",
      noSalesRecent: "No sales in the last 30 days yet.",
      soldSummary: "{qty} sold · {revenue}",
      recentOrders: "Recent orders",
    },
    productImages: {
      heading: "Images",
      noImages: "No images uploaded yet.",
      noAltText: "(no alt text)",
      primary: "Primary",
      delete: "Delete",
      deleting: "Deleting…",
      setAsPrimary: "Set as primary",
      imageUrlLabel: "Image URL or Google Drive file ID",
      imageUrlPlaceholder: "https://… or a Drive file ID",
      imageUrlHint: "The Google Drive file must be shared as \"Anyone with the link\".",
      addFromUrl: "Add from URL",
      addingFromUrl: "Adding…",
      enterUrlFirst: "Enter an image URL first.",
    },
  },
};

export const ar: Dictionary = {
  languageSwitcher: { label: "اللغة" },
  nav: {
    shop: "المتجر",
    search: "بحث",
    searchPlaceholder: "ابحث عن القهوة، أدوات التحضير، العلامات التجارية…",
    searchLabel: "ابحث عن المنتجات",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    menu: "القائمة",
    primary: "القائمة الرئيسية",
    mobile: "قائمة الجوال",
    cart: "السلة",
    cartWithCount: "السلة، {count} عنصر",
    account: "حسابي",
    signIn: "تسجيل الدخول",
  },
  footer: {
    shop: "المتجر",
    shopAll: "كل المنتجات",
    policies: "السياسات",
    contact: "التواصل",
  },
  product: {
    addToCart: "أضف إلى السلة",
    adding: "جارٍ الإضافة…",
    addedToCart: "تمت الإضافة إلى السلة.",
    wishlistAdd: "أضف إلى المفضلة",
    wishlistRemove: "إزالة من المفضلة",
    quantity: "الكمية",
    inStock: "متوفر",
    outOfStock: "غير متوفر",
  },
  admin: {
    dashboard: "لوحة التحكم",
    catalog: "الكتالوج",
    products: "المنتجات",
    categories: "الفئات",
    brands: "العلامات التجارية",
    inventory: "المخزون",
    sales: "المبيعات",
    orders: "الطلبات",
    customers: "العملاء",
    marketing: "التسويق",
    promotions: "العروض",
    coupons: "كوبونات الخصم",
    reviews: "التقييمات",
    questions: "الأسئلة",
    content: "المحتوى",
    cms: "إدارة الصفحات",
    siteSettings: "إعدادات الموقع",
    insights: "التقارير والتحليلات",
    reports: "التقارير",
    aiAssistant: "المساعد الذكي",
    system: "النظام",
    staff: "الموظفون",
    roles: "الصلاحيات",
    integrations: "التكاملات",
    notifications: "الإشعارات",
    signOut: "تسجيل الخروج",
    productsPage: {
      heading: "المنتجات",
      addProduct: "إضافة منتج",
      status: "الحالة",
      allStatuses: "كل الحالات",
      filter: "تصفية",
      clear: "مسح",
      edit: "تعديل",
      archive: "أرشفة",
      noProducts: "لا توجد منتجات بعد",
      noProductsHint: "ستظهر المنتجات التي تضيفها هنا.",
    },
    productForm: {
      essentials: "الأساسيات",
      name: "الاسم",
      productImage: "رابط صورة المنتج أو معرّف ملف Google Drive (اختياري)",
      productImagePlaceholder: "https://… أو معرّف ملف من Drive",
      priceBhd: "السعر (د.ب)",
      category: "الفئة",
      selectCategory: "اختر فئة",
      stockQuantity: "كمية المخزون",
      active: "نشط (يظهر في المتجر)",
      advancedOptions: "خيارات متقدمة",
      createProduct: "إنشاء المنتج",
      saveChanges: "حفظ التغييرات",
      saving: "جارٍ الحفظ…",
      stock: "المخزون",
    },
    categoriesPage: {
      heading: "الفئات",
    },
    categoryForm: {
      name: "الاسم",
      active: "نشط (يظهر في المتجر)",
      advancedOptions: "خيارات متقدمة",
      createCategory: "إنشاء الفئة",
      saveChanges: "حفظ التغييرات",
    },
    orderStatus: {
      pending_payment: "بانتظار الدفع",
      confirmed: "مؤكد",
      preparing: "قيد التحضير",
      ready: "جاهز",
      out_for_delivery: "قيد التوصيل",
      completed: "مكتمل",
      cancelled: "ملغى",
    },
    paymentStatus: {
      pending: "بانتظار الدفع",
      authorized: "معتمد",
      paid: "مدفوع",
      failed: "فشل",
      cancelled: "ملغى",
      refunded: "مسترجع",
      cash_pending: "نقدي عند التوصيل/الاستلام",
      cash_confirmed: "تم تأكيد الدفع النقدي",
    },
    ordersPage: {
      heading: "الطلبات",
      noOrders: "لا توجد طلبات مطابقة لهذه الفلاتر.",
      search: "بحث",
      searchPlaceholder: "رقم الطلب، الاسم، الجوال، أو الإيميل",
      status: "الحالة",
      allStatuses: "كل الحالات",
      advancedFilters: "فلاتر متقدمة",
      paymentStatus: "حالة الدفع",
      allPaymentStatuses: "كل حالات الدفع",
      fulfillment: "توصيل/استلام",
      both: "الكل",
      delivery: "توصيل",
      pickup: "استلام",
      dateFrom: "من تاريخ",
      dateTo: "إلى تاريخ",
      sortBy: "ترتيب حسب",
      sortDate: "التاريخ",
      sortTotal: "الإجمالي",
      sortOrderNumber: "رقم الطلب",
      direction: "الاتجاه",
      newestFirst: "الأحدث أولاً",
      oldestFirst: "الأقدم أولاً",
      applyFilters: "تطبيق الفلاتر",
      table: { order: "الطلب", customer: "العميل", fulfillment: "طريقة التسليم", status: "الحالة", payment: "الدفع", total: "الإجمالي", placed: "تاريخ الطلب" },
    },
    orderDetail: {
      backToOrders: "الطلبات",
      noPermission: "ليس لديك صلاحية للتصرف في هذا الطلب.",
      actions: {
        heading: "الإجراءات",
        confirmCashPayment: "تأكيد الدفع النقدي",
        confirming: "جارٍ التأكيد…",
        confirmPayment: "تأكيد الدفع",
        working: "جارٍ التنفيذ…",
        releaseReservation: "تحرير الحجز",
        releasing: "جارٍ التحرير…",
        cancelOrder: "إلغاء الطلب",
        cancelling: "جارٍ الإلغاء…",
        cancelReasonPrompt: "سبب إلغاء هذا الطلب (اختياري):",
        noPermission: "ليس لديك صلاحية للتصرف في هذا الطلب.",
        markDelivered: "تحديد كمُسلَّم",
        statusAction: {
          pending_payment: "نقل لبانتظار الدفع",
          confirmed: "تأكيد الطلب",
          preparing: "تحديد كقيد التحضير",
          ready: "تحديد كجاهز",
          out_for_delivery: "تحديد كقيد التوصيل",
          completed: "إكمال الطلب",
          cancelled: "إلغاء الطلب",
        },
      },
      customerInfo: { title: "معلومات العميل", name: "الاسم", mobile: "الجوال", email: "الإيميل", company: "الشركة", note: "ملاحظة" },
      paymentInfo: {
        title: "معلومات الدفع",
        method: "الطريقة",
        cash: "نقدي",
        card: "بطاقة (Tap)",
        status: "الحالة",
        subtotal: "المجموع الفرعي",
        delivery: "التوصيل",
        discount: "الخصم",
        grandTotal: "الإجمالي الكلي",
      },
      fulfillmentInfo: {
        deliveryTitle: "معلومات التوصيل",
        pickupTitle: "معلومات الاستلام",
        date: "التاريخ",
        timeWindow: "الفترة الزمنية",
        address: "العنوان",
        flat: "الشقة",
        landmark: "علامة مميزة",
        instructions: "تعليمات",
        location: "الموقع",
      },
      items: { title: "العناصر", item: "المنتج", sku: "رمز المنتج", qty: "الكمية", unitPrice: "سعر الوحدة", lineTotal: "إجمالي السطر" },
      reservationStatus: {
        title: "حالة حجز المخزون",
        product: "المنتج",
        qty: "الكمية",
        status: "الحالة",
        expires: "ينتهي في",
        reserved: "محجوز",
        committed: "مؤكد",
        released: "محرر",
        none: "لم يتم حجز أي مخزون لهذا الطلب (عناصر غير متتبعة فقط).",
      },
      timeline: { title: "سجل الحالات وتاريخ التدقيق", createdAs: "أُنشئ كـ", none: "لا يوجد سجل حالات بعد." },
    },
    customersPage: {
      heading: "العملاء",
      noCustomers: "لا يوجد عملاء مطابقين لهذه الفلاتر.",
      search: "بحث",
      searchPlaceholder: "الاسم، الجوال، أو الإيميل",
      applyFilters: "تطبيق الفلاتر",
      table: { name: "الاسم", contact: "التواصل", orders: "الطلبات", totalSpent: "إجمالي الإنفاق", lastOrder: "آخر طلب" },
    },
    customerDetail: {
      backToCustomers: "العملاء",
      totalOrders: "إجمالي الطلبات",
      totalSpent: "إجمالي الإنفاق",
      firstOrder: "أول طلب",
      lastOrder: "آخر طلب",
      contactInfo: {
        title: "معلومات التواصل",
        email: "الإيميل",
        mobile: "الجوال",
        company: "الشركة",
        accountType: "نوع الحساب",
        guest: "طلب كزائر",
        registered: "حساب مسجل",
      },
      orderHistory: "سجل الطلبات",
    },
    discountType: { percentage: "نسبة مئوية", fixed: "مبلغ ثابت", free_shipping: "توصيل مجاني" },
    couponForm: {
      code: "الرمز",
      type: "النوع",
      description: "الوصف",
      percentageValue: "النسبة المئوية (1-100)",
      fixedValue: "مبلغ ثابت (فلس)",
      categoryIds: "معرّفات الفئات (مفصولة بفاصلة)",
      brandIds: "معرّفات العلامات التجارية (مفصولة بفاصلة)",
      excludedProductIds: "معرّفات المنتجات المستثناة",
      excludedCategoryIds: "معرّفات الفئات المستثناة",
      minSubtotal: "الحد الأدنى للمجموع (فلس، 0 = بلا حد)",
      maxDiscountCap: "الحد الأقصى للخصم (فلس، 0 = بلا حد)",
      usageLimit: "حد الاستخدام (0 = غير محدود)",
      perCustomerLimit: "الحد لكل عميل (0 = غير محدود)",
      startsAt: "يبدأ في",
      endsAt: "ينتهي في",
      active: "نشط",
      firstOrderOnly: "أول طلب فقط",
      stackable: "يمكن دمجه مع العروض",
      advancedOptions: "خيارات متقدمة",
      createCoupon: "إنشاء الكوبون",
      saveChanges: "حفظ التغييرات",
      saving: "جارٍ الحفظ…",
    },
    couponsPage: {
      heading: "كوبونات الخصم",
      percentOff: "خصم {value}%",
      amountOff: "خصم {amount}",
      freeDelivery: "توصيل مجاني",
      used: "استُخدم {count}",
      active: "نشط",
      inactive: "غير نشط",
      edit: "تعديل",
      deactivate: "إيقاف",
      activate: "تفعيل",
      newCoupon: "كوبون جديد",
    },
    promotionForm: {
      name: "الاسم",
      type: "النوع",
      percentageValue: "النسبة المئوية (1-100)",
      fixedValue: "مبلغ ثابت (فلس)",
      categoryIds: "معرّفات الفئات (مفصولة بفاصلة، فارغ = كل المتجر)",
      brandIds: "معرّفات العلامات التجارية (مفصولة بفاصلة)",
      startsAt: "يبدأ في",
      endsAt: "ينتهي في",
      priority: "الأولوية (الأقل يفوز عند عدم الدمج)",
      active: "نشط",
      stackable: "يمكن دمجه مع عروض أخرى",
      advancedOptions: "خيارات متقدمة",
      createPromotion: "إنشاء العرض",
      saveChanges: "حفظ التغييرات",
      saving: "جارٍ الحفظ…",
    },
    promotionsPage: {
      heading: "العروض",
      percentOff: "خصم {value}%",
      amountOff: "خصم {value} فلس",
      freeDelivery: "توصيل مجاني",
      priority: "الأولوية {priority}",
      stackable: "قابل للدمج",
      exclusive: "حصري",
      active: "نشط",
      inactive: "غير نشط",
      edit: "تعديل",
      deactivate: "إيقاف",
      activate: "تفعيل",
      newPromotion: "عرض جديد",
    },
    staffPage: {
      heading: "الموظفون",
      addStaffAccount: "إضافة حساب موظف",
      noStaff: "لا يوجد موظفون بعد.",
      table: { email: "الإيميل", roles: "الصلاحيات", status: "الحالة", actions: "الإجراءات" },
      statusActive: "نشط",
      statusDeactivated: "معطّل",
      deactivate: "تعطيل",
      activate: "تفعيل",
      forceLogout: "تسجيل خروج إجباري",
      resetPassword: "إعادة تعيين كلمة السر",
      passwordResetSent: "تم إرسال إيميل إعادة تعيين كلمة السر.",
    },
    createStaffForm: {
      email: "الإيميل",
      displayName: "الاسم الظاهر (اختياري)",
      roles: "الأدوار",
      noRoles: "لا توجد أدوار بعد.",
      creating: "جارٍ الإنشاء…",
      createAccount: "إنشاء حساب موظف",
      successMessage: "تم إنشاء حساب موظف لـ {email}. تم إرسال إيميل لتعيين كلمة السر.",
    },
    rolesPage: {
      heading: "الأدوار",
      createRole: "إنشاء دور",
      noRoles: "لا توجد أدوار بعد.",
      table: { name: "الاسم", description: "الوصف", permissions: "الصلاحيات", actions: "الإجراءات" },
      system: "نظامي",
      delete: "حذف",
    },
    roleForm: {
      roleId: "معرّف الدور",
      name: "الاسم",
      description: "الوصف",
      permissions: "الصلاحيات",
      namespace: "القسم",
      creating: "جارٍ الإنشاء…",
      createRole: "إنشاء الدور",
    },
    siteSettingsPage: { heading: "إعدادات الموقع" },
    siteSettingsForm: {
      storeIdentity: "هوية المتجر",
      storeName: "اسم المتجر",
      contactEmail: "إيميل التواصل",
      contactPhone: "رقم التواصل",
      paymentProviders: "طرق الدفع",
      paymentProvidersHint: "إيقاف أي طريقة يخفيها فوراً من صفحة الدفع — الطلبات الحالية ما تتأثر.",
      tapEnabled: "الدفع بالبطاقة (Tap)",
      cashOnDelivery: "نقدي عند التوصيل",
      cashOnPickup: "نقدي عند الاستلام",
      maintenanceMode: "وضع الصيانة",
      maintenanceEnabled: "مفعّل (يظهر شريط تنبيه في كل صفحات الموقع)",
      maintenanceMessage: "رسالة الصيانة",
      advancedOptions: "خيارات متقدمة",
      copyrightText: "نص حقوق النشر",
      logoUrl: "رابط الشعار",
      faviconUrl: "رابط أيقونة المتصفح",
      hours: "ساعات العمل",
      policiesAndShipping: "السياسات والتوصيل",
      shippingPolicyText: "نص سياسة التوصيل",
      freeShippingThresholdText: "نص حد التوصيل المجاني (نص عرض فقط)",
      navigationAndFooter: "التنقل والتذييل",
      headerLinks: "روابط الهيدر (سطر لكل رابط، `الاسم|/الرابط`)",
      socialLinks: "روابط التواصل الاجتماعي (سطر لكل رابط، `المنصة|https://…`)",
      paymentLogos: "شعارات الدفع (اسم لكل سطر)",
      footerColumnsJson: "أعمدة التذييل (JSON: [{title, links:[{label,href}]}])",
      showCategoryMenu: "إظهار قائمة الفئات",
      showBrandMenu: "إظهار قائمة العلامات التجارية",
      homepageSections: "أقسام الصفحة الرئيسية",
      titleOverride: "تخصيص العنوان",
      subtitleOverride: "تخصيص العنوان الفرعي",
      sectionHero: "بانر البداية",
      sectionFeatured: "منتجات مميزة",
      sectionNewArrivals: "وصل حديثاً",
      sectionCoffee: "القهوة",
      sectionEquipment: "المعدات",
      sectionBrands: "أفضل العلامات التجارية مبيعاً",
      footerColumnsInvalidJson: "أعمدة التذييل يجب أن تكون بصيغة JSON صحيحة.",
      saving: "جارٍ الحفظ…",
      saveSettings: "حفظ الإعدادات",
    },
    cmsPagesPage: {
      heading: "صفحات المحتوى",
      newPage: "صفحة جديدة",
      editPage: "تعديل الصفحة",
      noPages: "لا توجد صفحات بعد.",
      table: { title: "العنوان", slug: "الرابط", status: "الحالة", nav: "القائمة", footer: "التذييل" },
      yes: "نعم",
      deleting: "جارٍ الحذف…",
      delete: "حذف",
    },
    cmsPageForm: {
      title: "العنوان",
      slug: "الرابط (اختياري — يُشتق من العنوان إذا تُرك فارغاً)",
      content: "المحتوى",
      seoTitle: "عنوان SEO",
      seoDescription: "وصف SEO",
      status: "الحالة",
      statusDraft: "مسودة",
      statusPublished: "منشورة",
      sortOrder: "ترتيب العرض",
      showInNav: "إظهار في قائمة الهيدر",
      showInFooter: "إظهار في التذييل",
      saving: "جارٍ الحفظ…",
      saveChanges: "حفظ التغييرات",
      createPage: "إنشاء الصفحة",
    },
    reportsPage: {
      heading: "التقارير",
      from: "من",
      to: "إلى",
      salesBucketedBy: "تجميع المبيعات حسب",
      day: "يوم",
      week: "أسبوع",
      month: "شهر",
      apply: "تطبيق",
      sales: "المبيعات",
      bestSellingProducts: "الأكثر مبيعاً",
      ordersByStatus: "الطلبات حسب الحالة",
      cashPayments: "المدفوعات النقدية",
      onlinePayments: "المدفوعات الإلكترونية (Tap)",
      pendingCashCollection: "نقدي بانتظار التحصيل",
      noDataInRange: "لا توجد بيانات في هذه الفترة.",
      noSalesInRange: "لا توجد مبيعات في هذه الفترة.",
      noPendingCash: "لا توجد مدفوعات نقدية بانتظار التحصيل.",
      salesTable: { period: "الفترة", orders: "الطلبات", revenue: "الإيرادات" },
      bestSellersTable: { product: "المنتج", sku: "رمز المنتج", qtySold: "الكمية المباعة", revenue: "الإيرادات" },
      ordersByStatusTable: { status: "الحالة", orders: "الطلبات" },
      cashSummary: {
        cashStatus: "حالة النقدي",
        orders: "الطلبات",
        total: "الإجمالي",
        pendingCollection: "بانتظار التحصيل",
        confirmed: "مؤكد",
        deliveryPickupSummary: "{delivery} توصيل، {pickup} استلام.",
      },
      onlineSummary: { status: "حالة الدفع الإلكتروني", orders: "الطلبات", total: "الإجمالي" },
      pendingCashTable: { order: "الطلب", customer: "العميل", fulfillment: "طريقة التسليم", amount: "المبلغ", placed: "تاريخ الطلب" },
    },
    reviewStatus: { pending: "بانتظار المراجعة", approved: "مقبول", rejected: "مرفوض", hidden: "مخفي" },
    reviewsPage: {
      heading: "التقييمات",
      all: "الكل",
      noReviews: "لا توجد تقييمات بعد.",
      verifiedPurchase: "شراء موثّق",
      product: "منتج",
      approve: "قبول",
      reject: "رفض",
      hide: "إخفاء",
    },
    questionStatus: { pending: "بانتظار الرد", approved: "مقبول", rejected: "مرفوض" },
    questionsPage: {
      heading: "أسئلة المنتجات",
      all: "الكل",
      noQuestions: "لا توجد أسئلة بعد.",
      product: "منتج",
      answerLabel: "الإجابة",
      answerPrefix: "ج:",
      answer: "إجابة",
      reject: "رفض",
    },
    brandsPage: {
      heading: "العلامات التجارية",
      editBrand: 'تعديل "{name}"',
      createBrand: "إنشاء علامة تجارية",
      cancelEdit: "إلغاء التعديل",
      noBrands: "لا توجد علامات تجارية بعد.",
      inactive: "(غير نشط)",
      edit: "تعديل",
      deleting: "جارٍ الحذف…",
      delete: "حذف",
    },
    brandForm: {
      name: "الاسم",
      slug: "الرابط (اختياري — يُشتق من الاسم إذا تُرك فارغاً)",
      description: "الوصف",
      website: "الموقع الإلكتروني",
      active: "نشط",
      saving: "جارٍ الحفظ…",
      saveChanges: "حفظ التغييرات",
      createBrand: "إنشاء علامة تجارية",
      brandUpdated: "تم تحديث العلامة التجارية.",
      brandCreated: 'تم إنشاء العلامة التجارية "{name}".',
    },
    inventoryPage: {
      heading: "المخزون",
      noInventory: "لا يوجد مخزون متتبَّع بعد.",
      onHand: "المتوفر بالمخزن",
      reserved: "محجوز",
      available: "متاح",
      lowStock: "مخزون منخفض",
    },
    adjustInventoryForm: {
      reason: "السبب",
      quantityChange: "تغيير الكمية",
      note: "ملاحظة (اختياري)",
      apply: "تطبيق",
      applying: "جارٍ التطبيق…",
      invalidQuantity: "أدخل رقماً صحيحاً غير صفري (سالب لإنقاص المخزون).",
      updated: "تم التحديث: المتوفر الآن {onHand} (كان {onHandBefore}).",
    },
    integrationsPage: {
      heading: "التكاملات",
      subheading: "طرق الدفع، المساعد الذكي، والوصول لأنظمة خارجية.",
      providersTitle: "مزودو الدفع والإيميل والذكاء الاصطناعي",
      tapPayments: "الدفع بالبطاقة (Tap)",
      transactionalEmail: "إيميلات النظام (SMTP)",
      aiAssistant: "المساعد الذكي للإدارة",
      systemTitle: "تكامل النظام وERP",
      jobApiAccess: "الوصول لواجهة برمجة المهام",
      configured: "مُفعّل",
      notConfigured: "غير مُفعّل",
      schedulerNote: "عند التفعيل، يقدر نظام جدولة خارجي يستدعي نقاط النهاية هذه، ونظام ERP/مخزون يقدر يستعلم عن نقطة مزامنة الطلبات — كلها موثّقة بمفتاح المهام السري.",
      emailRetryTitle: "قائمة إعادة محاولة الإيميلات",
      emailRetryDescription: "أرسل الإيميلات الفاشلة يدوياً الآن بدل انتظار الجدولة التالية.",
      emailRetryButton: "إعادة محاولة الإيميلات الفاشلة الآن",
      notificationRetryTitle: "قائمة إعادة محاولة إشعارات توفر المخزون",
      notificationRetryDescription: "أرسل إشعارات توفر المخزون الفاشلة يدوياً الآن بدل انتظار الجدولة التالية.",
      notificationRetryButton: "إعادة محاولة الإشعارات الفاشلة الآن",
      retrying: "جارٍ إعادة المحاولة…",
      retryResult: "أُعيدت محاولة {attempted}: نجح {succeeded}، وما زال {stillFailing} فاشل.",
    },
    backInStockPage: {
      heading: "اشتراكات توفر المخزون",
      noSubscriptions: "لا توجد اشتراكات توفر مخزون بعد.",
      table: { email: "الإيميل", product: "المنتج", variant: "النوع", status: "الحالة", subscribed: "تاريخ الاشتراك", notified: "تاريخ الإشعار" },
      statusPending: "بانتظار التوفر",
      statusNotified: "تم الإشعار",
      statusCancelled: "ملغى",
    },
    aiAssistantPage: {
      heading: "المساعد الذكي للإدارة",
      subheading: "اسأل عن الطلبات والمدفوعات وتحصيل النقد. الإجابات للقراءة فقط ومبنية على بيانات تقارير متجرك فقط.",
      askLabel: "اسأل عن متجرك",
      askPlaceholder: "مثلاً: أي الطلبات لسا بانتظار تحصيل النقد؟",
      asking: "جارٍ السؤال…",
      ask: "اسأل",
      aiGenerated: "من الذكاء الاصطناعي",
      storeDataSnapshot: "لقطة من بيانات المتجر",
      exampleQuestions: [
        "كم باقي نقدي بانتظار التحصيل؟",
        "كيف اتجاه المدفوعات الإلكترونية؟",
        "شنو توزيع حالات الطلبات عندنا؟",
      ],
    },
    dashboardPage: {
      heading: "لوحة التحكم",
      signedInAs: "مسجل دخول بحساب {email}.",
      noPermission: "ليس لديك صلاحية لعرض لوحة التحكم.",
      totalOrders: "إجمالي الطلبات",
      revenue: "الإيرادات",
      inventoryAvailability: "{available} متاح ({reserved} محجوز)",
      lowStock: "مخزون منخفض",
      outOfStock: "نفد المخزون",
      nothingLow: "لا يوجد شي بمخزون منخفض.",
      nothingOut: "لا يوجد شي نافد.",
      viewInventory: "عرض المخزون ←",
      topSellingProducts: "الأكثر مبيعاً (آخر 30 يوم)",
      noSalesRecent: "لا توجد مبيعات بآخر 30 يوم بعد.",
      soldSummary: "بيع {qty} · {revenue}",
      recentOrders: "أحدث الطلبات",
    },
    productImages: {
      heading: "الصور",
      noImages: "لا توجد صور بعد.",
      noAltText: "(بدون نص بديل)",
      primary: "الصورة الرئيسية",
      delete: "حذف",
      deleting: "جارٍ الحذف…",
      setAsPrimary: "اجعلها الصورة الرئيسية",
      imageUrlLabel: "رابط الصورة أو معرّف ملف Google Drive",
      imageUrlPlaceholder: "https://… أو معرّف ملف من Drive",
      imageUrlHint: "لازم ملف Google Drive يكون مشارك بخيار \"أي شخص لديه الرابط\".",
      addFromUrl: "إضافة من رابط",
      addingFromUrl: "جارٍ الإضافة…",
      enterUrlFirst: "أدخل رابط الصورة أولاً.",
    },
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, ar };

/** Pure lookup, no hooks — safe to call from a Server Component (with the cookie-derived locale) or a Client Component (with the locale it was handed as a prop). */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
