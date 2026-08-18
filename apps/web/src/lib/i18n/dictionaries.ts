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
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, ar };

/** Pure lookup, no hooks — safe to call from a Server Component (with the cookie-derived locale) or a Client Component (with the locale it was handed as a prop). */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
