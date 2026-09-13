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
    coffee: string;
    equipment: string;
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
      priceBhd: string;
      category: string;
      selectCategory: string;
      stockQuantity: string;
      active: string;
      advancedOptions: string;
      createProduct: string;
      saveChanges: string;
      saving: string;
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
  };
}

export const en: Dictionary = {
  languageSwitcher: { label: "Language" },
  nav: {
    shop: "Shop",
    coffee: "Coffee",
    equipment: "Equipment",
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
      productImage: "Product image (optional)",
      priceBhd: "Price (BHD)",
      category: "Category",
      selectCategory: "Select a category",
      stockQuantity: "Stock quantity",
      active: "Active (visible on the storefront)",
      advancedOptions: "Advanced options",
      createProduct: "Create product",
      saveChanges: "Save changes",
      saving: "Saving…",
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
  },
};

export const ar: Dictionary = {
  languageSwitcher: { label: "اللغة" },
  nav: {
    shop: "المتجر",
    coffee: "القهوة",
    equipment: "المعدات",
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
      productImage: "صورة المنتج (اختياري)",
      priceBhd: "السعر (د.ب)",
      category: "الفئة",
      selectCategory: "اختر فئة",
      stockQuantity: "كمية المخزون",
      active: "نشط (يظهر في المتجر)",
      advancedOptions: "خيارات متقدمة",
      createProduct: "إنشاء المنتج",
      saveChanges: "حفظ التغييرات",
      saving: "جارٍ الحفظ…",
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
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, ar };

/** Pure lookup, no hooks — safe to call from a Server Component (with the cookie-derived locale) or a Client Component (with the locale it was handed as a prop). */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
