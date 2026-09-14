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
  storefront: {
    cart: {
      heading: string;
      empty: string;
      continueShopping: string;
      unavailableItemName: string;
      itemNoLongerAvailable: string;
      itemOutOfStock: string;
      /** `{qty}` replaced */
      quantityReduced: string;
      /** `{name}` replaced */
      quantityFor: string;
      remove: string;
      proceedToCheckout: string;
      resolveIssues: string;
      orderSummary: string;
      subtotal: string;
      freeDelivery: string;
      delivery: string;
      total: string;
      couponCode: string;
      couponCodePlaceholder: string;
      apply: string;
      /** `{code}` replaced */
      couponApplied: string;
    };
    checkout: {
      heading: string;
      cartNeedsAttention: string;
      cartEmpty: string;
      backToCart: string;
      yourDetails: string;
      fullName: string;
      mobileNumber: string;
      email: string;
      /** `{email}` replaced */
      signedInAs: string;
      companyOptional: string;
      orderNoteOptional: string;
      deliveryOrPickup: string;
      delivery: string;
      pickup: string;
      areaGovernorate: string;
      block: string;
      road: string;
      buildingHouse: string;
      flatOfficeOptional: string;
      landmarkOptional: string;
      deliveryInstructionsOptional: string;
      pickupInstructionsOptional: string;
      schedule: string;
      dateAndTime: string;
      noSlotsAvailable: string;
      unavailableSuffix: string;
      payment: string;
      noPaymentMethods: string;
      cashOnDelivery: string;
      cashOnPickup: string;
      payByCard: string;
      placingOrder: string;
      placeOrder: string;
      thankYouOrderPlaced: string;
      viewYourOrderConfirmation: string;
    };
    tracking: {
      heading: string;
      description: string;
      orderNumber: string;
      mobileOrEmail: string;
      lookingUp: string;
      trackOrder: string;
      fulfillment: string;
      scheduledFor: string;
      payment: string;
      total: string;
    };
    listing: {
      category: string;
      allCategories: string;
      brand: string;
      allBrands: string;
      productType: string;
      productTypePlaceholder: string;
      minPrice: string;
      maxPrice: string;
      availability: string;
      allItems: string;
      inStockOnly: string;
      featuredOnly: string;
      sortBy: string;
      sortNewest: string;
      sortNameAsc: string;
      sortPriceAsc: string;
      sortPriceDesc: string;
      applyFilters: string;
      clearAll: string;
      filters: string;
      closeFilters: string;
      layout: string;
      grid: string;
      list: string;
      pagination: string;
      previous: string;
      next: string;
      noProductsTitle: string;
      noProductsDescription: string;
      featuredBadge: string;
      lowStock: string;
      /** `{price}` replaced */
      compareAtPriceLabel: string;
      loadError: string;
      loadErrorHint: string;
      tryAgain: string;
      breadcrumb: string;
      shopAllHeading: string;
    };
    search: {
      heading: string;
      startTyping: string;
      startTypingHint: string;
      keepTyping: string;
      /** `{count}` replaced */
      keepTypingHint: string;
      /** `{query}` replaced */
      resultsFor: string;
      /** `{query}` replaced */
      noResultsFor: string;
    };
    home: {
      hero: {
        highlightsLabel: string;
        /** `{n}` and `{total}` replaced */
        showHighlight: string;
        slide1: { badge: string; title: string; subtitle: string; primaryLabel: string; secondaryLabel: string };
        slide2: { badge: string; title: string; subtitle: string; primaryLabel: string; secondaryLabel: string };
        slide3: { badge: string; title: string; subtitle: string; primaryLabel: string; secondaryLabel: string };
      };
      brandsWeCarry: string;
      browse: string;
      allProducts: string;
      featured: string;
      featuredProductsTitle: string;
      newArrivalsTitle: string;
      coffeeTitle: string;
      coffeeDescription: string;
      equipmentTitle: string;
      equipmentDescription: string;
      shopByBrandTitle: string;
      viewAll: string;
    };
    detail: {
      home: string;
      skuLabel: string;
      selectOptionToContinue: string;
      outOfStockShort: string;
      productImagesLabel: string;
      /** `{n}` and `{total}` replaced */
      showImage: string;
      weightLabel: string;
      dimensionsLabel: string;
      relatedProductsHeading: string;
    };
    reviews: {
      heading: string;
      reviewSingular: string;
      reviewPlural: string;
      /** `{status}` replaced */
      yourReviewStatus: string;
      statusAwaitingModeration: string;
      cancel: string;
      editYourReview: string;
      writeAReview: string;
      signInToReview: string;
      noReviews: string;
      verifiedPurchase: string;
      title: string;
      reviewLabel: string;
      saving: string;
      saveChanges: string;
      submitReview: string;
      deleting: string;
      delete: string;
      ratingLegend: string;
      /** `{rating}` replaced */
      starsAriaLabel: string;
    };
    questions: {
      heading: string;
      askAQuestion: string;
      thanksWeWillAnswer: string;
      submitting: string;
      submitQuestion: string;
      signInToAsk: string;
      noQuestions: string;
      questionPrefix: string;
      answerPrefix: string;
    };
    backInStock: {
      emailMeLabel: string;
      notifyMe: string;
      submitting: string;
      subscribedMessage: string;
      genericError: string;
      notWaitingOnAlerts: string;
      productUnavailable: string;
      unsubscribe: string;
    };
    account: {
      login: {
        email: string;
        password: string;
        signingIn: string;
        signIn: string;
        emailRequired: string;
        enterValidEmail: string;
        passwordRequired: string;
        rateLimited: string;
        invalidCredentials: string;
        genericError: string;
      };
      register: {
        fullName: string;
        email: string;
        password: string;
        passwordHint: string;
        marketingConsentLabel: string;
        creatingAccount: string;
        createAccount: string;
        fullNameRequired: string;
        emailRequired: string;
        enterValidEmail: string;
        passwordMinLength: string;
        accountExists: string;
        genericError: string;
      };
      forgotPassword: {
        email: string;
        emailRequired: string;
        enterValidEmail: string;
        sending: string;
        sendResetLink: string;
        rateLimited: string;
        genericError: string;
        successMessage: string;
      };
      notifications: {
        transactionalHeading: string;
        marketingHeading: string;
        orderUpdates: string;
        backInStock: string;
        promotions: string;
        questionAnswered: string;
        reviewStatusChanges: string;
        marketingConsentLabel: string;
        preferencesSaved: string;
        genericError: string;
        saving: string;
        savePreferences: string;
      };
      profile: {
        fullName: string;
        mobile: string;
        saving: string;
        saveChanges: string;
        profileUpdated: string;
      };
      resendVerification: {
        sending: string;
        resend: string;
        sent: string;
      };
      logout: {
        signingOut: string;
        signOut: string;
      };
      pages: {
        signIn: string;
        forgotYourPassword: string;
        newHere: string;
        createAnAccount: string;
        createYourAccount: string;
        alreadyHaveAccount: string;
        resetYourPassword: string;
        navOverview: string;
        navOrders: string;
        navProfile: string;
        navAddresses: string;
        navWishlist: string;
        navNotifications: string;
        /** `{name}` replaced */
        welcome: string;
        verifyEmailPrompt: string;
        totalOrders: string;
        manageAddresses: string;
        viewWishlist: string;
        recentOrders: string;
        viewAll: string;
        noOrdersYet: string;
        profileHeading: string;
        backInStockAlertsHeading: string;
        notificationPreferencesHeading: string;
        orderHistoryHeading: string;
        backToOrders: string;
        wishlistHeading: string;
        savedAddressesHeading: string;
        noOrdersPlaced: string;
        reorder: string;
        addingToCart: string;
        /** `{count}` replaced */
        addedToCartMessage: string;
        /** `{added}` and `{skipped}` replaced */
        addedToCartWithSkipped: string;
        verificationLinkMissingHeading: string;
        verificationLinkMissingMessage: string;
        emailVerifiedHeading: string;
        emailVerifiedMessage: string;
        goToYourAccount: string;
        verificationLinkInvalidHeading: string;
        verificationLinkInvalidMessage: string;
        goToAccountRequestNew: string;
        wishlistEmpty: string;
        moveToCart: string;
      };
    };
    addresses: {
      noAddresses: string;
      defaultBadge: string;
      edit: string;
      setAsDefault: string;
      delete: string;
      addNewAddress: string;
      label: string;
      labelValues: Record<"home" | "work" | "farm" | "custom", string>;
      customLabel: string;
      recipientName: string;
      mobile: string;
      area: string;
      block: string;
      road: string;
      building: string;
      flatOptional: string;
      setAsDefaultCheckbox: string;
      saving: string;
      saveChanges: string;
      addAddress: string;
    };
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
    signingOut: string;
    noPermissionPage: string;
    pagination: { label: string; previous: string; next: string };
    brandLabel: string;
    openMenu: string;
    closeMenu: string;
    menuTitle: string;
    productsPage: {
      heading: string;
      addProduct: string;
      status: string;
      allStatuses: string;
      filter: string;
      clear: string;
      edit: string;
      archive: string;
      archiving: string;
      noProducts: string;
      noProductsHint: string;
    };
    variantEditor: {
      /** `{n}` replaced with the variant's position (1-based) */
      variantLabel: string;
      remove: string;
      sku: string;
      barcode: string;
      priceOverride: string;
      compareAtOverride: string;
      costOverride: string;
      weightOverride: string;
      status: string;
      lowStockThreshold: string;
      trackInventory: string;
      allowBackorder: string;
      attributeSelectionsLegend: string;
      attributePlaceholder: string;
      valuePlaceholder: string;
      addAttribute: string;
      addVariant: string;
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
      basicsHeading: string;
      slug: string;
      productType: string;
      shortDescription: string;
      fullDescription: string;
      brand: string;
      noBrand: string;
      status: string;
      additionalCategories: string;
      visibility: string;
      featured: string;
      tags: string;
      seoHeading: string;
      seoTitle: string;
      seoDescription: string;
      identifiersHeading: string;
      sku: string;
      skuAutoGenerated: string;
      barcode: string;
      compareAtPrice: string;
      costPrice: string;
      taxClass: string;
      inventoryHeading: string;
      trackInventory: string;
      allowBackorder: string;
      lowStockThreshold: string;
      shippingHeading: string;
      weight: string;
      length: string;
      width: string;
      height: string;
      coffeeAttributesHeading: string;
      beanType: string;
      roastLevel: string;
      originCountry: string;
      region: string;
      farmOrProducer: string;
      processingMethod: string;
      variety: string;
      grindType: string;
      tastingNotes: string;
      equipmentAttributesHeading: string;
      manufacturer: string;
      model: string;
      material: string;
      color: string;
      capacity: string;
      voltage: string;
      warrantyPeriod: string;
      variantsHeading: string;
      hasVariantsLabel: string;
      nameAndCategoryRequired: string;
      priceRequired: string;
      productSaved: string;
      productCreated: string;
      /** `{message}` replaced */
      stockNotSaved: string;
      /** `{message}` replaced */
      imageNotAdded: string;
    };
    categoriesPage: {
      heading: string;
      noCategories: string;
      inactive: string;
      edit: string;
      /** `{name}` replaced */
      editCategory: string;
      cancelEdit: string;
      deleting: string;
      delete: string;
    };
    categoryForm: {
      name: string;
      active: string;
      advancedOptions: string;
      createCategory: string;
      saveChanges: string;
      saving: string;
      slug: string;
      description: string;
      parentCategory: string;
      noParent: string;
      sortOrder: string;
      seoTitle: string;
      seoDescription: string;
      categoryUpdated: string;
      /** `{name}` replaced */
      categoryCreated: string;
    };
    orderStatus: Record<"pending_payment" | "confirmed" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled", string>;
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
        statusAction: Record<"pending_payment" | "confirmed" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled", string>;
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
  storefront: {
    cart: {
      heading: "Your cart",
      empty: "Your cart is empty.",
      continueShopping: "Continue shopping",
      unavailableItemName: "Item no longer available",
      itemNoLongerAvailable: "This item is no longer available and won't be included at checkout.",
      itemOutOfStock: "This item is out of stock and won't be included at checkout.",
      quantityReduced: "Quantity reduced to {qty} due to limited stock.",
      quantityFor: "Quantity for {name}",
      remove: "Remove",
      proceedToCheckout: "Proceed to checkout",
      resolveIssues: "Please resolve the issues above before checking out.",
      orderSummary: "Order summary",
      subtotal: "Subtotal",
      freeDelivery: "Free delivery",
      delivery: "Delivery",
      total: "Total",
      couponCode: "Coupon code",
      couponCodePlaceholder: "Coupon code",
      apply: "Apply",
      couponApplied: "Coupon {code} applied",
    },
    checkout: {
      heading: "Checkout",
      cartNeedsAttention: "Some items in your cart need attention before you can check out.",
      cartEmpty: "Your cart is empty.",
      backToCart: "Back to cart",
      yourDetails: "Your details",
      fullName: "Full name",
      mobileNumber: "Mobile number",
      email: "Email",
      signedInAs: "Signed in as {email} — this order will appear in your order history.",
      companyOptional: "Company (optional)",
      orderNoteOptional: "Order note (optional)",
      deliveryOrPickup: "Delivery or pickup",
      delivery: "Delivery",
      pickup: "Pickup",
      areaGovernorate: "Area / Governorate",
      block: "Block",
      road: "Road",
      buildingHouse: "Building / House",
      flatOfficeOptional: "Flat / Office (optional)",
      landmarkOptional: "Landmark (optional)",
      deliveryInstructionsOptional: "Delivery instructions (optional)",
      pickupInstructionsOptional: "Pickup instructions (optional)",
      schedule: "Schedule",
      dateAndTime: "Date and time",
      noSlotsAvailable: "No slots available",
      unavailableSuffix: " (unavailable)",
      payment: "Payment",
      noPaymentMethods: "No payment methods are currently available. Please check back later.",
      cashOnDelivery: "Cash on delivery",
      cashOnPickup: "Cash on pickup",
      payByCard: "Pay by card",
      placingOrder: "Placing order…",
      placeOrder: "Place order",
      thankYouOrderPlaced: "Thank you — your order has been placed!",
      viewYourOrderConfirmation: "View your order confirmation",
    },
    tracking: {
      heading: "Track your order",
      description: "Enter your order number and the mobile number or email you used at checkout.",
      orderNumber: "Order number",
      mobileOrEmail: "Mobile number or email",
      lookingUp: "Looking up…",
      trackOrder: "Track order",
      fulfillment: "Fulfillment",
      scheduledFor: "Scheduled for",
      payment: "Payment",
      total: "Total",
    },
    listing: {
      category: "Category",
      allCategories: "All categories",
      brand: "Brand",
      allBrands: "All brands",
      productType: "Product type",
      productTypePlaceholder: "coffee, equipment…",
      minPrice: "Min price (BHD)",
      maxPrice: "Max price (BHD)",
      availability: "Availability",
      allItems: "All items",
      inStockOnly: "In stock only",
      featuredOnly: "Featured only",
      sortBy: "Sort by",
      sortNewest: "Newest",
      sortNameAsc: "Name (A–Z)",
      sortPriceAsc: "Price (low to high)",
      sortPriceDesc: "Price (high to low)",
      applyFilters: "Apply filters",
      clearAll: "Clear all",
      filters: "Filters",
      closeFilters: "Close filters",
      layout: "Layout",
      grid: "Grid",
      list: "List",
      pagination: "Pagination",
      previous: "Previous",
      next: "Next",
      noProductsTitle: "No products match these filters",
      noProductsDescription: "Try widening your price range or clearing a filter to see more results.",
      featuredBadge: "Featured",
      lowStock: "Low stock",
      compareAtPriceLabel: "Compare at price {price}",
      loadError: "Something went wrong loading products",
      loadErrorHint: "Please try again in a moment.",
      tryAgain: "Try again",
      breadcrumb: "Breadcrumb",
      shopAllHeading: "Shop all products",
    },
    search: {
      heading: "Search",
      startTyping: "Start typing to search",
      startTypingHint: "Search by product name, brand, category, or tag.",
      keepTyping: "Keep typing…",
      keepTypingHint: "Enter at least {count} characters to search.",
      resultsFor: 'Results for "{query}"',
      noResultsFor: 'No products matched "{query}"',
    },
    home: {
      hero: {
        highlightsLabel: "Hero highlights",
        showHighlight: "Show highlight {n} of {total}",
        slide1: {
          badge: "Coffee & brewing equipment",
          title: "Thoughtfully sourced coffee, brewed right.",
          subtitle: "Browse our current selection of beans and brewing gear. New arrivals and favorites, all in one place.",
          primaryLabel: "Shop all products",
          secondaryLabel: "Search the catalog",
        },
        slide2: {
          badge: "Just landed",
          title: "Fresh arrivals, roasted for now.",
          subtitle: "New beans and gear land regularly — the catalog sorts newest-first, so today's additions are always up top.",
          primaryLabel: "See new arrivals",
          secondaryLabel: "Search the catalog",
        },
        slide3: {
          badge: "Staff picks",
          title: "Our favorites, front and center.",
          subtitle: "A curated shortlist of what we think you'll love — hand-picked, not just best-selling.",
          primaryLabel: "Shop featured picks",
          secondaryLabel: "Search the catalog",
        },
      },
      brandsWeCarry: "Brands we carry",
      browse: "Browse",
      allProducts: "All products",
      featured: "Featured",
      featuredProductsTitle: "Featured products",
      newArrivalsTitle: "New arrivals",
      coffeeTitle: "Coffee",
      coffeeDescription: "Beans from our current lineup.",
      equipmentTitle: "Equipment",
      equipmentDescription: "Brewers, grinders, and accessories.",
      shopByBrandTitle: "Shop by brand",
      viewAll: "View all",
    },
    detail: {
      home: "Home",
      skuLabel: "SKU:",
      selectOptionToContinue: "Select an available option to continue.",
      outOfStockShort: "Out of stock.",
      productImagesLabel: "Product images",
      showImage: "Show image {n} of {total}",
      weightLabel: "Weight",
      dimensionsLabel: "Dimensions",
      relatedProductsHeading: "You might also like",
    },
    reviews: {
      heading: "Reviews",
      reviewSingular: "review",
      reviewPlural: "reviews",
      yourReviewStatus: "Your review is {status}.",
      statusAwaitingModeration: "awaiting moderation",
      cancel: "Cancel",
      editYourReview: "Edit your review",
      writeAReview: "Write a review",
      signInToReview: "Sign in to write a review.",
      noReviews: "No reviews yet.",
      verifiedPurchase: "Verified purchase",
      title: "Title",
      reviewLabel: "Review",
      saving: "Saving…",
      saveChanges: "Save changes",
      submitReview: "Submit review",
      deleting: "Deleting…",
      delete: "Delete",
      ratingLegend: "Rating",
      starsAriaLabel: "{rating} out of 5 stars",
    },
    questions: {
      heading: "Questions & answers",
      askAQuestion: "Ask a question",
      thanksWeWillAnswer: "Thanks — we'll post an answer soon.",
      submitting: "Submitting…",
      submitQuestion: "Submit question",
      signInToAsk: "Sign in to ask a question.",
      noQuestions: "No questions yet.",
      questionPrefix: "Q:",
      answerPrefix: "A:",
    },
    backInStock: {
      emailMeLabel: "Email me when back in stock",
      notifyMe: "Notify me",
      submitting: "Submitting…",
      subscribedMessage: "We'll email you when this is back in stock.",
      genericError: "Something went wrong. Please try again.",
      notWaitingOnAlerts: "You're not waiting on any back-in-stock alerts.",
      productUnavailable: "Product no longer available",
      unsubscribe: "Unsubscribe",
    },
    account: {
      login: {
        email: "Email",
        password: "Password",
        signingIn: "Signing in…",
        signIn: "Sign in",
        emailRequired: "Email is required.",
        enterValidEmail: "Enter a valid email address.",
        passwordRequired: "Password is required.",
        rateLimited: "Too many sign-in attempts. Please try again shortly.",
        invalidCredentials: "Invalid email or password.",
        genericError: "Something went wrong signing you in. Please try again.",
      },
      register: {
        fullName: "Full name",
        email: "Email",
        password: "Password",
        passwordHint: "At least 8 characters.",
        marketingConsentLabel: "Send me offers and promotions by email (optional — you can change this anytime in your account).",
        creatingAccount: "Creating account…",
        createAccount: "Create account",
        fullNameRequired: "Please enter your full name.",
        emailRequired: "Email is required.",
        enterValidEmail: "Enter a valid email address.",
        passwordMinLength: "Password must be at least 8 characters.",
        accountExists: "An account with this email already exists.",
        genericError: "Something went wrong. Please try again.",
      },
      forgotPassword: {
        email: "Email",
        emailRequired: "Email is required.",
        enterValidEmail: "Enter a valid email address.",
        sending: "Sending…",
        sendResetLink: "Send reset link",
        rateLimited: "Too many requests. Please try again shortly.",
        genericError: "Something went wrong. Please try again.",
        successMessage: "If an account exists for this email, a password reset email has been sent.",
      },
      notifications: {
        transactionalHeading: "Transactional notifications",
        marketingHeading: "Marketing",
        orderUpdates: "Order status updates",
        backInStock: "Back-in-stock alerts",
        promotions: "Promotions and offers",
        questionAnswered: "My product questions were answered",
        reviewStatusChanges: "My review status changes",
        marketingConsentLabel: "Send me offers and promotions by email",
        preferencesSaved: "Preferences saved.",
        genericError: "Something went wrong. Please try again.",
        saving: "Saving…",
        savePreferences: "Save preferences",
      },
      profile: {
        fullName: "Full name",
        mobile: "Mobile",
        saving: "Saving…",
        saveChanges: "Save changes",
        profileUpdated: "Profile updated.",
      },
      resendVerification: {
        sending: "Sending…",
        resend: "Resend verification email",
        sent: "Verification email sent.",
      },
      logout: {
        signingOut: "Signing out…",
        signOut: "Sign out",
      },
      pages: {
        signIn: "Sign in",
        forgotYourPassword: "Forgot your password?",
        newHere: "New here?",
        createAnAccount: "Create an account",
        createYourAccount: "Create your account",
        alreadyHaveAccount: "Already have an account?",
        resetYourPassword: "Reset your password",
        navOverview: "Overview",
        navOrders: "Orders",
        navProfile: "Profile",
        navAddresses: "Addresses",
        navWishlist: "Wishlist",
        navNotifications: "Notifications",
        welcome: "Welcome, {name}",
        verifyEmailPrompt: "Please verify your email address to unlock all account features.",
        totalOrders: "Total orders",
        manageAddresses: "Manage addresses",
        viewWishlist: "View wishlist",
        recentOrders: "Recent orders",
        viewAll: "View all",
        noOrdersYet: "No orders yet.",
        profileHeading: "Profile",
        backInStockAlertsHeading: "Back-in-stock alerts",
        notificationPreferencesHeading: "Notification preferences",
        orderHistoryHeading: "Order history",
        backToOrders: "← Orders",
        wishlistHeading: "Wishlist",
        savedAddressesHeading: "Saved addresses",
        noOrdersPlaced: "You haven't placed any orders yet.",
        reorder: "Reorder",
        addingToCart: "Adding to cart…",
        addedToCartMessage: "Added {count} item(s) to your cart.",
        addedToCartWithSkipped: "Added {added} item(s) to your cart ({skipped} no longer available).",
        verificationLinkMissingHeading: "Verification link missing",
        verificationLinkMissingMessage: "This link is missing its verification code.",
        emailVerifiedHeading: "Email verified",
        emailVerifiedMessage: "Your email address has been verified.",
        goToYourAccount: "Go to your account",
        verificationLinkInvalidHeading: "Verification link invalid",
        verificationLinkInvalidMessage: "This verification link is invalid or has expired.",
        goToAccountRequestNew: "Go to your account to request a new one",
        wishlistEmpty: "Your wishlist is empty. Browse products and tap the heart to save them here.",
        moveToCart: "Move to cart",
      },
    },
    addresses: {
      noAddresses: "You haven't saved any addresses yet.",
      defaultBadge: "Default",
      edit: "Edit",
      setAsDefault: "Set as default",
      delete: "Delete",
      addNewAddress: "Add a new address",
      label: "Label",
      labelValues: { home: "Home", work: "Work", farm: "Farm", custom: "Custom" },
      customLabel: "Custom label",
      recipientName: "Recipient name",
      mobile: "Mobile",
      area: "Area",
      block: "Block",
      road: "Road",
      building: "Building",
      flatOptional: "Flat (optional)",
      setAsDefaultCheckbox: "Set as default address",
      saving: "Saving…",
      saveChanges: "Save changes",
      addAddress: "Add address",
    },
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
    signingOut: "Signing out…",
    noPermissionPage: "You don't have permission to view this page.",
    pagination: { label: "Pagination", previous: "Previous", next: "Next" },
    brandLabel: "Admin",
    openMenu: "Open admin menu",
    closeMenu: "Close menu",
    menuTitle: "Admin menu",
    productsPage: {
      heading: "Products",
      addProduct: "Add product",
      status: "Status",
      allStatuses: "All statuses",
      filter: "Filter",
      clear: "Clear",
      edit: "Edit",
      archive: "Archive",
      archiving: "Archiving…",
      noProducts: "No products yet",
      noProductsHint: "Products you add will show up here.",
    },
    variantEditor: {
      variantLabel: "Variant {n}",
      remove: "Remove",
      sku: "SKU",
      barcode: "Barcode",
      priceOverride: "Price override",
      compareAtOverride: "Compare-at override",
      costOverride: "Cost override",
      weightOverride: "Weight override (g)",
      status: "Status",
      lowStockThreshold: "Low-stock threshold",
      trackInventory: "Track inventory",
      allowBackorder: "Allow backorder",
      attributeSelectionsLegend: "Attribute selections (e.g. Bag size = 500g)",
      attributePlaceholder: "Attribute",
      valuePlaceholder: "Value",
      addAttribute: "Add attribute",
      addVariant: "Add variant",
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
      basicsHeading: "Basics",
      slug: "Slug (optional — derived from name if left blank)",
      productType: "Product type (e.g. coffee_beans, grinder)",
      shortDescription: "Short description",
      fullDescription: "Full description",
      brand: "Brand",
      noBrand: "No brand",
      status: "Status",
      additionalCategories: "Additional categories",
      visibility: "Visibility",
      featured: "Featured",
      tags: "Tags (comma-separated)",
      seoHeading: "SEO",
      seoTitle: "SEO title",
      seoDescription: "SEO description",
      identifiersHeading: "Identifiers & pricing",
      sku: "SKU",
      skuAutoGenerated: "(auto-generated if left blank)",
      barcode: "Barcode (optional)",
      compareAtPrice: "Compare-at price (BHD)",
      costPrice: "Cost price (BHD)",
      taxClass: "Tax classification (for your records)",
      inventoryHeading: "Inventory",
      trackInventory: "Track inventory",
      allowBackorder: "Allow backorder",
      lowStockThreshold: "Low-stock threshold",
      shippingHeading: "Shipping",
      weight: "Weight (g)",
      length: "Length (cm)",
      width: "Width (cm)",
      height: "Height (cm)",
      coffeeAttributesHeading: "Coffee attributes (optional)",
      beanType: "Bean type",
      roastLevel: "Roast level",
      originCountry: "Origin country",
      region: "Region",
      farmOrProducer: "Farm or producer",
      processingMethod: "Processing method",
      variety: "Variety",
      grindType: "Grind type",
      tastingNotes: "Tasting notes (comma-separated)",
      equipmentAttributesHeading: "Equipment attributes (optional)",
      manufacturer: "Manufacturer",
      model: "Model",
      material: "Material",
      color: "Color",
      capacity: "Capacity",
      voltage: "Voltage",
      warrantyPeriod: "Warranty period",
      variantsHeading: "Variants",
      hasVariantsLabel: "This product has variants",
      nameAndCategoryRequired: "Name and a category are required.",
      priceRequired: "Price is required.",
      productSaved: "Product saved.",
      productCreated: "Product created.",
      stockNotSaved: "Stock quantity wasn't saved ({message}) — set it from the product page.",
      imageNotAdded: "Image wasn't added ({message}) — add it from the product page.",
    },
    categoriesPage: {
      heading: "Categories",
      noCategories: "No categories yet.",
      inactive: "(inactive)",
      edit: "Edit",
      editCategory: 'Edit "{name}"',
      cancelEdit: "Cancel edit",
      deleting: "Deleting…",
      delete: "Delete",
    },
    categoryForm: {
      name: "Name",
      active: "Active (visible on the storefront)",
      advancedOptions: "Advanced options",
      createCategory: "Create category",
      saveChanges: "Save changes",
      saving: "Saving…",
      slug: "Slug (optional — derived from name if left blank)",
      description: "Description",
      parentCategory: "Parent category",
      noParent: "No parent (top-level)",
      sortOrder: "Sort order",
      seoTitle: "SEO title",
      seoDescription: "SEO description",
      categoryUpdated: "Category updated.",
      categoryCreated: 'Category "{name}" created.',
    },
    orderStatus: {
      pending_payment: "Pending payment",
      confirmed: "Confirmed",
      accepted: "Accepted",
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
          accepted: "Accept order",
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
  storefront: {
    cart: {
      heading: "سلتك",
      empty: "سلتك فارغة.",
      continueShopping: "متابعة التسوق",
      unavailableItemName: "المنتج لم يعد متوفراً",
      itemNoLongerAvailable: "هذا المنتج لم يعد متوفراً ولن يُدرج عند الدفع.",
      itemOutOfStock: "هذا المنتج غير متوفر بالمخزون ولن يُدرج عند الدفع.",
      quantityReduced: "تم تقليل الكمية إلى {qty} بسبب محدودية المخزون.",
      quantityFor: "الكمية لـ {name}",
      remove: "إزالة",
      proceedToCheckout: "المتابعة إلى الدفع",
      resolveIssues: "يرجى حل المشاكل أعلاه قبل إتمام الدفع.",
      orderSummary: "ملخص الطلب",
      subtotal: "المجموع الفرعي",
      freeDelivery: "توصيل مجاني",
      delivery: "التوصيل",
      total: "الإجمالي",
      couponCode: "كود الخصم",
      couponCodePlaceholder: "كود الخصم",
      apply: "تطبيق",
      couponApplied: "تم تطبيق كود الخصم {code}",
    },
    checkout: {
      heading: "الدفع",
      cartNeedsAttention: "بعض المنتجات في سلتك تحتاج انتباه قبل إتمام الدفع.",
      cartEmpty: "سلتك فارغة.",
      backToCart: "الرجوع إلى السلة",
      yourDetails: "بياناتك",
      fullName: "الاسم الكامل",
      mobileNumber: "رقم الجوال",
      email: "البريد الإلكتروني",
      signedInAs: "مسجل الدخول كـ {email} — سيظهر هذا الطلب في سجل طلباتك.",
      companyOptional: "الشركة (اختياري)",
      orderNoteOptional: "ملاحظة على الطلب (اختياري)",
      deliveryOrPickup: "التوصيل أو الاستلام",
      delivery: "التوصيل",
      pickup: "الاستلام",
      areaGovernorate: "المنطقة / المحافظة",
      block: "المجمع",
      road: "الطريق",
      buildingHouse: "المبنى / المنزل",
      flatOfficeOptional: "الشقة / المكتب (اختياري)",
      landmarkOptional: "علامة مميزة (اختياري)",
      deliveryInstructionsOptional: "تعليمات التوصيل (اختياري)",
      pickupInstructionsOptional: "تعليمات الاستلام (اختياري)",
      schedule: "الموعد",
      dateAndTime: "التاريخ والوقت",
      noSlotsAvailable: "لا توجد مواعيد متاحة",
      unavailableSuffix: " (غير متاح)",
      payment: "الدفع",
      noPaymentMethods: "لا توجد طرق دفع متاحة حالياً. يرجى المحاولة لاحقاً.",
      cashOnDelivery: "الدفع نقداً عند التوصيل",
      cashOnPickup: "الدفع نقداً عند الاستلام",
      payByCard: "الدفع بالبطاقة",
      placingOrder: "جارٍ إرسال الطلب…",
      placeOrder: "إرسال الطلب",
      thankYouOrderPlaced: "شكراً لك — تم إرسال طلبك!",
      viewYourOrderConfirmation: "عرض تأكيد طلبك",
    },
    tracking: {
      heading: "تتبع طلبك",
      description: "أدخل رقم الطلب ورقم الجوال أو البريد الإلكتروني الذي استخدمته عند الدفع.",
      orderNumber: "رقم الطلب",
      mobileOrEmail: "رقم الجوال أو البريد الإلكتروني",
      lookingUp: "جارٍ البحث…",
      trackOrder: "تتبع الطلب",
      fulfillment: "طريقة التسليم",
      scheduledFor: "موعد التسليم",
      payment: "الدفع",
      total: "الإجمالي",
    },
    listing: {
      category: "الفئة",
      allCategories: "كل الفئات",
      brand: "العلامة التجارية",
      allBrands: "كل العلامات التجارية",
      productType: "نوع المنتج",
      productTypePlaceholder: "قهوة، أدوات تحضير…",
      minPrice: "أقل سعر (د.ب)",
      maxPrice: "أعلى سعر (د.ب)",
      availability: "التوفر",
      allItems: "كل المنتجات",
      inStockOnly: "المتوفر فقط",
      featuredOnly: "المميز فقط",
      sortBy: "ترتيب حسب",
      sortNewest: "الأحدث",
      sortNameAsc: "الاسم (أ–ي)",
      sortPriceAsc: "السعر (من الأقل للأعلى)",
      sortPriceDesc: "السعر (من الأعلى للأقل)",
      applyFilters: "تطبيق الفلاتر",
      clearAll: "مسح الكل",
      filters: "الفلاتر",
      closeFilters: "إغلاق الفلاتر",
      layout: "طريقة العرض",
      grid: "شبكة",
      list: "قائمة",
      pagination: "تصفح الصفحات",
      previous: "السابق",
      next: "التالي",
      noProductsTitle: "لا توجد منتجات مطابقة لهذه الفلاتر",
      noProductsDescription: "جرّب توسيع نطاق السعر أو إزالة أحد الفلاتر لرؤية المزيد من النتائج.",
      featuredBadge: "مميز",
      lowStock: "مخزون منخفض",
      compareAtPriceLabel: "سعر المقارنة {price}",
      loadError: "حدث خطأ أثناء تحميل المنتجات",
      loadErrorHint: "يرجى المحاولة مرة أخرى بعد قليل.",
      tryAgain: "حاول مرة أخرى",
      breadcrumb: "مسار التنقل",
      shopAllHeading: "تسوّق كل المنتجات",
    },
    search: {
      heading: "البحث",
      startTyping: "ابدأ الكتابة للبحث",
      startTypingHint: "ابحث باسم المنتج، العلامة التجارية، الفئة، أو الوسم.",
      keepTyping: "أكمل الكتابة…",
      keepTypingHint: "أدخل {count} أحرف على الأقل للبحث.",
      resultsFor: 'نتائج البحث عن "{query}"',
      noResultsFor: 'لا توجد منتجات مطابقة لـ "{query}"',
    },
    home: {
      hero: {
        highlightsLabel: "أبرز العروض",
        showHighlight: "عرض الميزة {n} من {total}",
        slide1: {
          badge: "القهوة وأدوات التحضير",
          title: "قهوة مختارة بعناية، تُحضَّر بالطريقة الصحيحة.",
          subtitle: "تصفح مجموعتنا الحالية من حبوب القهوة وأدوات التحضير. أحدث الوصولات والمفضلات، كلها في مكان واحد.",
          primaryLabel: "تسوّق كل المنتجات",
          secondaryLabel: "ابحث في الكتالوج",
        },
        slide2: {
          badge: "وصل حديثاً",
          title: "وصولات جديدة، محمّصة لهذه اللحظة.",
          subtitle: "تصل حبوب وأدوات جديدة بانتظام — يُرتَّب الكتالوج بالأحدث أولاً، فتظهر إضافات اليوم دائماً في الأعلى.",
          primaryLabel: "شاهد الوصولات الجديدة",
          secondaryLabel: "ابحث في الكتالوج",
        },
        slide3: {
          badge: "اختيارات الفريق",
          title: "مفضلاتنا، في الواجهة.",
          subtitle: "قائمة مختارة بعناية لما نعتقد أنك ستحبه — منتقاة يدوياً، وليست فقط الأكثر مبيعاً.",
          primaryLabel: "تسوّق الاختيارات المميزة",
          secondaryLabel: "ابحث في الكتالوج",
        },
      },
      brandsWeCarry: "العلامات التجارية لدينا",
      browse: "تصفح",
      allProducts: "كل المنتجات",
      featured: "مميز",
      featuredProductsTitle: "منتجات مميزة",
      newArrivalsTitle: "وصولات جديدة",
      coffeeTitle: "القهوة",
      coffeeDescription: "حبوب من تشكيلتنا الحالية.",
      equipmentTitle: "المعدات",
      equipmentDescription: "أدوات تحضير، مطاحن، وملحقات.",
      shopByBrandTitle: "تسوّق حسب العلامة التجارية",
      viewAll: "عرض الكل",
    },
    detail: {
      home: "الرئيسية",
      skuLabel: "رمز المنتج:",
      selectOptionToContinue: "اختر خياراً متاحاً للمتابعة.",
      outOfStockShort: "غير متوفر بالمخزون.",
      productImagesLabel: "صور المنتج",
      showImage: "عرض الصورة {n} من {total}",
      weightLabel: "الوزن",
      dimensionsLabel: "الأبعاد",
      relatedProductsHeading: "قد يعجبك أيضاً",
    },
    reviews: {
      heading: "التقييمات",
      reviewSingular: "تقييم",
      reviewPlural: "تقييمات",
      yourReviewStatus: "تقييمك حالياً {status}.",
      statusAwaitingModeration: "بانتظار المراجعة",
      cancel: "إلغاء",
      editYourReview: "تعديل تقييمك",
      writeAReview: "أضف تقييماً",
      signInToReview: "سجّل الدخول لإضافة تقييم.",
      noReviews: "لا توجد تقييمات بعد.",
      verifiedPurchase: "عملية شراء موثّقة",
      title: "العنوان",
      reviewLabel: "التقييم",
      saving: "جارٍ الحفظ…",
      saveChanges: "حفظ التغييرات",
      submitReview: "إرسال التقييم",
      deleting: "جارٍ الحذف…",
      delete: "حذف",
      ratingLegend: "التقييم",
      starsAriaLabel: "{rating} من 5 نجوم",
    },
    questions: {
      heading: "الأسئلة والأجوبة",
      askAQuestion: "اطرح سؤالاً",
      thanksWeWillAnswer: "شكراً — سننشر الإجابة قريباً.",
      submitting: "جارٍ الإرسال…",
      submitQuestion: "إرسال السؤال",
      signInToAsk: "سجّل الدخول لطرح سؤال.",
      noQuestions: "لا توجد أسئلة بعد.",
      questionPrefix: "س:",
      answerPrefix: "ج:",
    },
    backInStock: {
      emailMeLabel: "أرسل لي بريداً عند توفره",
      notifyMe: "أعلمني",
      submitting: "جارٍ الإرسال…",
      subscribedMessage: "سنرسل لك بريداً عندما يتوفر هذا المنتج مجدداً.",
      genericError: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      notWaitingOnAlerts: "لا تنتظر أي تنبيهات لتوفر المنتجات.",
      productUnavailable: "المنتج لم يعد متوفراً",
      unsubscribe: "إلغاء الاشتراك",
    },
    account: {
      login: {
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        signingIn: "جارٍ تسجيل الدخول…",
        signIn: "تسجيل الدخول",
        emailRequired: "البريد الإلكتروني مطلوب.",
        enterValidEmail: "أدخل بريداً إلكترونياً صحيحاً.",
        passwordRequired: "كلمة المرور مطلوبة.",
        rateLimited: "محاولات تسجيل دخول كثيرة. يرجى المحاولة لاحقاً.",
        invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        genericError: "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.",
      },
      register: {
        fullName: "الاسم الكامل",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        passwordHint: "8 أحرف على الأقل.",
        marketingConsentLabel: "أرسل لي عروضاً وخصومات عبر البريد الإلكتروني (اختياري — يمكنك تغيير هذا لاحقاً من حسابك).",
        creatingAccount: "جارٍ إنشاء الحساب…",
        createAccount: "إنشاء حساب",
        fullNameRequired: "يرجى إدخال اسمك الكامل.",
        emailRequired: "البريد الإلكتروني مطلوب.",
        enterValidEmail: "أدخل بريداً إلكترونياً صحيحاً.",
        passwordMinLength: "يجب أن تكون كلمة المرور 8 أحرف على الأقل.",
        accountExists: "يوجد حساب بهذا البريد الإلكتروني بالفعل.",
        genericError: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      },
      forgotPassword: {
        email: "البريد الإلكتروني",
        emailRequired: "البريد الإلكتروني مطلوب.",
        enterValidEmail: "أدخل بريداً إلكترونياً صحيحاً.",
        sending: "جارٍ الإرسال…",
        sendResetLink: "إرسال رابط إعادة التعيين",
        rateLimited: "طلبات كثيرة. يرجى المحاولة لاحقاً.",
        genericError: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
        successMessage: "إذا كان هناك حساب بهذا البريد الإلكتروني، فقد تم إرسال بريد إعادة تعيين كلمة المرور.",
      },
      notifications: {
        transactionalHeading: "الإشعارات التشغيلية",
        marketingHeading: "التسويق",
        orderUpdates: "تحديثات حالة الطلب",
        backInStock: "تنبيهات توفر المنتج",
        promotions: "العروض والخصومات",
        questionAnswered: "تمت الإجابة على أسئلتي عن المنتجات",
        reviewStatusChanges: "تغيّرت حالة تقييمي",
        marketingConsentLabel: "أرسل لي عروضاً وخصومات عبر البريد الإلكتروني",
        preferencesSaved: "تم حفظ التفضيلات.",
        genericError: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
        saving: "جارٍ الحفظ…",
        savePreferences: "حفظ التفضيلات",
      },
      profile: {
        fullName: "الاسم الكامل",
        mobile: "رقم الجوال",
        saving: "جارٍ الحفظ…",
        saveChanges: "حفظ التغييرات",
        profileUpdated: "تم تحديث الملف الشخصي.",
      },
      resendVerification: {
        sending: "جارٍ الإرسال…",
        resend: "إعادة إرسال بريد التحقق",
        sent: "تم إرسال بريد التحقق.",
      },
      logout: {
        signingOut: "جارٍ تسجيل الخروج…",
        signOut: "تسجيل الخروج",
      },
      pages: {
        signIn: "تسجيل الدخول",
        forgotYourPassword: "نسيت كلمة المرور؟",
        newHere: "جديد هنا؟",
        createAnAccount: "إنشاء حساب",
        createYourAccount: "أنشئ حسابك",
        alreadyHaveAccount: "لديك حساب بالفعل؟",
        resetYourPassword: "إعادة تعيين كلمة المرور",
        navOverview: "نظرة عامة",
        navOrders: "الطلبات",
        navProfile: "الملف الشخصي",
        navAddresses: "العناوين",
        navWishlist: "المفضلة",
        navNotifications: "الإشعارات",
        welcome: "مرحباً، {name}",
        verifyEmailPrompt: "يرجى تأكيد بريدك الإلكتروني لفتح جميع ميزات الحساب.",
        totalOrders: "إجمالي الطلبات",
        manageAddresses: "إدارة العناوين",
        viewWishlist: "عرض المفضلة",
        recentOrders: "الطلبات الأخيرة",
        viewAll: "عرض الكل",
        noOrdersYet: "لا توجد طلبات بعد.",
        profileHeading: "الملف الشخصي",
        backInStockAlertsHeading: "تنبيهات توفر المنتج",
        notificationPreferencesHeading: "تفضيلات الإشعارات",
        orderHistoryHeading: "سجل الطلبات",
        backToOrders: "← الطلبات",
        wishlistHeading: "المفضلة",
        savedAddressesHeading: "العناوين المحفوظة",
        noOrdersPlaced: "لم تقم بطلب أي شيء بعد.",
        reorder: "إعادة الطلب",
        addingToCart: "جارٍ الإضافة إلى السلة…",
        addedToCartMessage: "تمت إضافة {count} عنصر إلى سلتك.",
        addedToCartWithSkipped: "تمت إضافة {added} عنصر إلى سلتك ({skipped} لم يعد متوفراً).",
        verificationLinkMissingHeading: "رابط التحقق مفقود",
        verificationLinkMissingMessage: "هذا الرابط لا يحتوي على رمز التحقق.",
        emailVerifiedHeading: "تم تأكيد البريد الإلكتروني",
        emailVerifiedMessage: "تم تأكيد بريدك الإلكتروني.",
        goToYourAccount: "الذهاب إلى حسابك",
        verificationLinkInvalidHeading: "رابط التحقق غير صالح",
        verificationLinkInvalidMessage: "رابط التحقق هذا غير صالح أو منتهي الصلاحية.",
        goToAccountRequestNew: "اذهب إلى حسابك لطلب رابط جديد",
        wishlistEmpty: "قائمة مفضلتك فارغة. تصفح المنتجات واضغط على القلب لحفظها هنا.",
        moveToCart: "نقل إلى السلة",
      },
    },
    addresses: {
      noAddresses: "لم تحفظ أي عناوين بعد.",
      defaultBadge: "افتراضي",
      edit: "تعديل",
      setAsDefault: "تعيين كافتراضي",
      delete: "حذف",
      addNewAddress: "إضافة عنوان جديد",
      label: "التسمية",
      labelValues: { home: "المنزل", work: "العمل", farm: "المزرعة", custom: "مخصص" },
      customLabel: "تسمية مخصصة",
      recipientName: "اسم المستلم",
      mobile: "رقم الجوال",
      area: "المنطقة",
      block: "المجمع",
      road: "الطريق",
      building: "المبنى",
      flatOptional: "الشقة (اختياري)",
      setAsDefaultCheckbox: "تعيين كعنوان افتراضي",
      saving: "جارٍ الحفظ…",
      saveChanges: "حفظ التغييرات",
      addAddress: "إضافة عنوان",
    },
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
    signingOut: "جارٍ تسجيل الخروج…",
    noPermissionPage: "ليس لديك صلاحية لعرض هذه الصفحة.",
    pagination: { label: "تصفح الصفحات", previous: "السابق", next: "التالي" },
    brandLabel: "الإدارة",
    openMenu: "فتح قائمة الإدارة",
    closeMenu: "إغلاق القائمة",
    menuTitle: "قائمة الإدارة",
    productsPage: {
      heading: "المنتجات",
      addProduct: "إضافة منتج",
      status: "الحالة",
      allStatuses: "كل الحالات",
      filter: "تصفية",
      clear: "مسح",
      edit: "تعديل",
      archive: "أرشفة",
      archiving: "جارٍ الأرشفة…",
      noProducts: "لا توجد منتجات بعد",
      noProductsHint: "ستظهر المنتجات التي تضيفها هنا.",
    },
    variantEditor: {
      variantLabel: "متغير {n}",
      remove: "إزالة",
      sku: "رمز المنتج (SKU)",
      barcode: "الباركود",
      priceOverride: "تجاوز السعر",
      compareAtOverride: "تجاوز سعر المقارنة",
      costOverride: "تجاوز التكلفة",
      weightOverride: "تجاوز الوزن (جم)",
      status: "الحالة",
      lowStockThreshold: "حد المخزون المنخفض",
      trackInventory: "تتبع المخزون",
      allowBackorder: "السماح بالطلب المسبق عند نفاد المخزون",
      attributeSelectionsLegend: "خيارات السمات (مثال: حجم الكيس = 500 جم)",
      attributePlaceholder: "السمة",
      valuePlaceholder: "القيمة",
      addAttribute: "إضافة سمة",
      addVariant: "إضافة متغير",
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
      basicsHeading: "الأساسيات",
      slug: "الرابط (اختياري — يُشتق من الاسم إذا تُرك فارغاً)",
      productType: "نوع المنتج (مثال: coffee_beans، grinder)",
      shortDescription: "وصف مختصر",
      fullDescription: "الوصف الكامل",
      brand: "العلامة التجارية",
      noBrand: "بدون علامة تجارية",
      status: "الحالة",
      additionalCategories: "فئات إضافية",
      visibility: "الظهور",
      featured: "مميز",
      tags: "الوسوم (مفصولة بفواصل)",
      seoHeading: "تحسين محركات البحث (SEO)",
      seoTitle: "عنوان SEO",
      seoDescription: "وصف SEO",
      identifiersHeading: "المعرّفات والتسعير",
      sku: "رمز المنتج (SKU)",
      skuAutoGenerated: "(يُنشأ تلقائياً إذا تُرك فارغاً)",
      barcode: "الباركود (اختياري)",
      compareAtPrice: "سعر المقارنة (د.ب)",
      costPrice: "سعر التكلفة (د.ب)",
      taxClass: "التصنيف الضريبي (لسجلاتك)",
      inventoryHeading: "المخزون",
      trackInventory: "تتبع المخزون",
      allowBackorder: "السماح بالطلب المسبق عند نفاد المخزون",
      lowStockThreshold: "حد المخزون المنخفض",
      shippingHeading: "الشحن",
      weight: "الوزن (جم)",
      length: "الطول (سم)",
      width: "العرض (سم)",
      height: "الارتفاع (سم)",
      coffeeAttributesHeading: "خصائص القهوة (اختياري)",
      beanType: "نوع الحبوب",
      roastLevel: "درجة التحميص",
      originCountry: "بلد المنشأ",
      region: "المنطقة",
      farmOrProducer: "المزرعة أو المنتج",
      processingMethod: "طريقة المعالجة",
      variety: "الصنف",
      grindType: "نوع الطحن",
      tastingNotes: "ملاحظات التذوق (مفصولة بفواصل)",
      equipmentAttributesHeading: "خصائص المعدات (اختياري)",
      manufacturer: "الشركة المصنعة",
      model: "الطراز",
      material: "الخامة",
      color: "اللون",
      capacity: "السعة",
      voltage: "الجهد الكهربائي",
      warrantyPeriod: "فترة الضمان",
      variantsHeading: "المتغيرات",
      hasVariantsLabel: "هذا المنتج له متغيرات",
      nameAndCategoryRequired: "الاسم والفئة مطلوبان.",
      priceRequired: "السعر مطلوب.",
      productSaved: "تم حفظ المنتج.",
      productCreated: "تم إنشاء المنتج.",
      stockNotSaved: "لم يتم حفظ كمية المخزون ({message}) — يمكنك ضبطها من صفحة المنتج.",
      imageNotAdded: "لم تتم إضافة الصورة ({message}) — يمكنك إضافتها من صفحة المنتج.",
    },
    categoriesPage: {
      heading: "الفئات",
      noCategories: "لا توجد فئات بعد.",
      inactive: "(غير نشط)",
      edit: "تعديل",
      editCategory: 'تعديل "{name}"',
      cancelEdit: "إلغاء التعديل",
      deleting: "جارٍ الحذف…",
      delete: "حذف",
    },
    categoryForm: {
      name: "الاسم",
      active: "نشط (يظهر في المتجر)",
      advancedOptions: "خيارات متقدمة",
      createCategory: "إنشاء الفئة",
      saveChanges: "حفظ التغييرات",
      saving: "جارٍ الحفظ…",
      slug: "الرابط (اختياري — يُشتق من الاسم إذا تُرك فارغاً)",
      description: "الوصف",
      parentCategory: "الفئة الأساسية",
      noParent: "بدون فئة أساسية (فئة رئيسية)",
      sortOrder: "ترتيب العرض",
      seoTitle: "عنوان SEO",
      seoDescription: "وصف SEO",
      categoryUpdated: "تم تحديث الفئة.",
      categoryCreated: 'تم إنشاء الفئة "{name}".',
    },
    orderStatus: {
      pending_payment: "بانتظار الدفع",
      confirmed: "مؤكد",
      accepted: "مقبول",
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
          accepted: "قبول الطلب",
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
