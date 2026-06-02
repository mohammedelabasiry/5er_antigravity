'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

export const translations = {
  en: {
    // Navbar
    navDashboard: "Dashboard",
    navMapDiscovery: "Map Discovery",
    navBeneficiarySearch: "Beneficiary Search",
    navMessages: "Messages",
    navHistory: "History",
    navResources: "Resources",
    navAuditReports: "Audit & Reports",
    navLogout: "Log out",
    navLogin: "Log in",
    navSignup: "Sign up",
    navGovernance: "Governance",

    // Common
    welcome: "Assalamu Alaikum",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    pending: "Pending",
    delivered: "Delivered",
    failed: "Failed",
    egp: "EGP",
    anonymous: "Anonymous",
    loading: "Loading...",
    status: "Status",
    date: "Date",
    details: "Details",
    
    // Landing Page
    heroTitle: "Transparent Sadaqah & Aid Governance",
    heroSubtitle: "KhairLink connects donors, beneficiaries, and charities in a secure, privacy-first, and auditable network with monthly support limits.",
    getStarted: "Get Started",
    learnMore: "Learn More",
    impactTitle: "Transparent Impact Realtime Registry",
    beneficiariesRegistered: "Beneficiaries Registered",
    totalDonations: "Total Donations Routed",
    deliveryRate: "Logistics Delivery Rate",
    
    // Chat
    secureShield: "Secure Shield Enabled",
    typeMessage: "Type your message securely...",
    supportChannels: "Support Channels",
    noChats: "No chats active",
    safetyNotice: "Privacy Governance: Direct contact details (phones, emails, IDs) are programmatically redacted/blocked.",
    
    // Map
    mapPortal: "Map Discovery Portal",
    searchRadius: "Search Radius",
    category: "Category",
    familyDetails: "Family Details",
    remainingNeed: "Remaining Need",
    donateDirect: "Donate Direct",
    anonymousDetails: "Anonymous Details",
    privacyShielded: "Privacy shielded: All beneficiary locations have a random 100-300m offset.",
    matches: "Matches",
    resetFilters: "Reset Filters",
    onlyShowNeeding: "Only show cases needing support",
    
    // Transactions
    ledgerTitle: "Financial & Resource Audit Ledger",
    ledgerSubtitle: "Transparent transaction registry matching aid distributions with active support caps.",
    totalRegistry: "Total Registry Count",
    totalTransactedValue: "Total Transacted Value",
    pendingGovernance: "Pending Governance Check",
  },
  ar: {
    // Navbar
    navDashboard: "لوحة التحكم",
    navMapDiscovery: "خريطة الحالات",
    navBeneficiarySearch: "بحث الحالات",
    navMessages: "الرسائل",
    navHistory: "سجل العمليات",
    navResources: "المساعدات العينية",
    navAuditReports: "التقارير والتدقيق",
    navLogout: "تسجيل الخروج",
    navLogin: "تسجيل الدخول",
    navSignup: "إنشاء حساب",
    navGovernance: "الحوكمة",

    // Common
    welcome: "السلام عليكم",
    save: "حفظ",
    cancel: "إلغاء",
    confirm: "تأكيد",
    pending: "قيد الانتظار",
    delivered: "تم التسليم",
    failed: "فشل التسليم",
    egp: "جنيه",
    anonymous: "فاعل خير",
    loading: "جاري التحميل...",
    status: "الحالة",
    date: "التاريخ",
    details: "التفاصيل",
    
    // Landing Page
    heroTitle: "حوكمة وإدارة الصدقات بشفافية تامّة",
    heroSubtitle: "منصة خير لينك تربط المتبرعين، المستفيدين، والجمعيات الخيرية في شبكة آمنة تحمي الخصوصية مع وضع حدود قصوى للمساعدات الشهرية.",
    getStarted: "ابدأ الآن",
    learnMore: "اقرأ المزيد",
    impactTitle: "سجل التأثير والشفافية المباشر",
    beneficiariesRegistered: "المستفيدين المسجلين",
    totalDonations: "إجمالي أموال الصدقات الموجهة",
    deliveryRate: "نسبة نجاح تسليم المساعدات",
    
    // Chat
    secureShield: "تم تفعيل درع الحماية الخصوصية",
    typeMessage: "اكتب رسالتك بشكل آمن...",
    supportChannels: "قنوات الدعم والتواصل",
    noChats: "لا توجد محادثات نشطة",
    safetyNotice: "إدارة الخصوصية: يتم حظر وحجب أرقام الهواتف أو الرقم القومي أو بيانات التواصل المباشر برمجياً لضمان كرامة المستفيدين.",
    
    // Map
    mapPortal: "بوابة استكشاف الحالات",
    searchRadius: "نطاق البحث الجغرافي",
    category: "الفئة المستحقة",
    familyDetails: "بيانات الأسرة",
    remainingNeed: "الاحتياج المتبقي",
    donateDirect: "تبرع مباشر",
    anonymousDetails: "تفاصيل مبهمة",
    privacyShielded: "حماية الخصوصية: إحداثيات المستفيدين معماة بنسبة عشوائية تتراوح بين 100 إلى 300 متر.",
    matches: "الحالات المطابقة",
    resetFilters: "إعادة ضبط التصفية",
    onlyShowNeeding: "أظهر فقط الحالات التي تحتاج لدعم عاجل هذا الشهر",
    
    // Transactions
    ledgerTitle: "سجل التدقيق المالي والعيني للصدقات",
    ledgerSubtitle: "سجل معاملات شفاف يربط عمليات توزيع المساعدات مع الحدود القصوى النشطة.",
    totalRegistry: "إجمالي القيود المسجلة",
    totalTransactedValue: "إجمالي قيمة المساعدات الموجهة",
    pendingGovernance: "بانتظار مراجعة الحوكمة",
  }
};

type LanguageContextType = {
  language: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['en']) => string;
  isRtl: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Load language preference from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved === 'ar' || saved === 'en') {
      setLanguage(saved);
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = saved;
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ar' : 'en';
    setLanguage(nextLang);
    localStorage.setItem('language', nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  };

  const t = (key: keyof typeof translations['en']): string => {
    return translations[language][key] || translations['en'][key] || String(key);
  };

  const isRtl = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
