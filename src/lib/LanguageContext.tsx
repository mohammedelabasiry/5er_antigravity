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
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    rejected: "Rejected",
    en_route: "En Route",
    transactions: "Transactions",
    
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

    // Dashboards Common & Donor
    welcomeBack: "Alhamdulillah, welcome back",
    welcomeName: "Welcome",
    donorPrivacyNotice: "Your donations are tracked transparently in coordinate boundaries for donor privacy.",
    discoverCases: "Discover Cases Near You",
    totalContributed: "Total Contributed",
    directSupportFunds: "Direct support funds",
    confirmedPending: "Confirmed & pending donations",
    directImpact: "Direct Impact",
    familiesSupported: "Families Supported",
    activeUrgentCases: "Active Urgent Support Cases",
    browseMap: "Browse Map",
    allTargetsCovered: "All monthly support targets are fully covered!",
    viewDetails: "View Details",
    support: "Support",
    contributionsHistory: "Your Contributions History",
    noDonationsYet: "You haven't made any donations yet.",
    startExploring: "Start by exploring verified local cases nearby.",
    uniqueCasesSupported: "Unique cases supported",

    // Beneficiary Dashboard
    caseId: "Case ID",
    chatRoom: "Chat Room",
    pendingAuditTitle: "Account Pending Governance Audit",
    pendingAuditDesc: "Your submitted documents are currently being checked by platform administrators. Once verification completes and your profile status changes to Approved, you will become searchable by local donors and organizations.",
    rejectedTitle: "Application Rejected",
    rejectedDesc: "Unfortunately, your need evaluation registration was rejected as it did not satisfy platform need criteria or contains incorrect information. Please contact admin support for details.",
    monthlySupportTracker: "Monthly Support Tracker",
    currentMonth: "Current Month",
    progressToTarget: "Progress to target",
    percentMet: "Met",
    monthlyCapTarget: "Monthly Cap Target",
    receivedAid: "Received Aid",
    remainingNeeded: "Remaining Needed",
    socioEconomicScore: "Socio-Economic Score",
    assignedBracket: "Assigned Bracket",
    extremelyVulnerable: "Extremely vulnerable",
    veryNeedy: "Very needy",
    needy: "Needy",
    limitedSupport: "Limited support",
    familyMembers: "Family Members",
    childrenUnder18: "Children under 18",
    employmentStatus: "Employment Status",
    rentBurden: "Rent Burden",
    contributionsLedger: "Contributions Ledger",
    noContributionsYet: "No contributions recorded yet for your case.",
    source: "Source",
    amount: "Amount",
    resourceDistributions: "Resource Distributions",
    noResourcesYet: "No physical packages dispatched to your address.",
    itemType: "Item Type",
    qty: "Qty",
    notifications: "Notifications",
    noNotifications: "No alerts in your inbox.",

    // Reports Dashboard
    governanceEngine: "Platform Governance Engine",
    auditLogsAnalytics: "Audit Logs & Analytics",
    charityLogsDesc: "Reviewing activity logs and support analytics for your organization.",
    adminLogsDesc: "Supervising platform-wide donation routing, support caps, and system audit logs.",
    beneficiaryReach: "Beneficiary Reach",
    approvedActiveCases: "Approved active support cases",
    cashSupportLedger: "Cash Support Ledger",
    directDonationsProcessed: "direct donations processed",
    physicalAidValue: "Physical Aid Value",
    distributionsCompleted: "supply distributions completed",
    totalAidValueRouted: "Total Aid Value Routed",
    directSupportLogistics: "Direct support and logistics value",
    vulnerabilityRatio: "Vulnerability Category Ratio",
    scoringDefinition: "Scoring Definition",
    scoringDefinitionDesc: "Category scores are calculated dynamically from family status, income level, debts, health issues, and housing conditions.",
    auditTrail: "Governance Audit Trail (Latest 50 actions)",
    timestamp: "Timestamp",
    actionEvent: "Action Event",
    operator: "Operator",
    operatorDetails: "Details",
    noAuditLogs: "No audit logs found matching criteria.",

    // Resource Logistics
    resourceLogisticsPortal: "Resource Logistics Portal",
    resourceLogisticsDesc: "Track and verify the distribution of physical resources (food crates, medicine, supplies) to registered beneficiary families.",
    noResourceDistributions: "No resource distributions recorded",
    noResourceDistributionsDesc: "There are no physical goods deliveries pending or completed in the system.",
    resourceItem: "Resource Item",
    beneficiaryFamily: "Beneficiary Family",
    logisticsValue: "Logistics Value",
    estimatedMarketValue: "Estimated Market Value",
    assignedDate: "Assigned",
    distributingEntity: "Distributing Entity",
    logisticsNotes: "Logistics Notes",
    updateLogisticsStatus: "Update Logistics Status",
    statusNotes: "Status Notes",
    addTrackingNotes: "Add tracking notes...",
    deliveryStatus: "Delivery Status",
    enRoute: "En Route",
    deliveryFailed: "Delivery Failed",
    refReferenceId: "Reference / ID",
    refBeneficiary: "Beneficiary",
    refSourceContributor: "Source Contributor",
    refTypeParticulars: "Type / Particulars",
    refValueEgp: "Value (EGP)",

    // Admin Dashboard
    systemAdmin: "System Administration",
    adminWelcome: "Welcome Back",
    adminTagline: "Governance Layer: Sadaqah target checks, case audit approvals, and fraud protection.",
    adminCore: "Admin Core",
    cases: "Cases",
    pendingVerification: "pending verification",
    totalRaised: "Total Raised",
    acrossCashResources: "Across cash & resources",
    charities: "Charities",
    pendingLicensing: "pending licensing review",
    donors: "Donors",
    activeContributors: "Active contributors",
    approvalQueue: "Approval Queue",
    auditCase: "Audit Case",
    verificationQueueClear: "Verification Queue Clear",
    verificationQueueClearDesc: "All registered profiles have been audited.",
    recentAuditLog: "Recent Audit Log trail",
    beneficiariesDirectory: "Beneficiaries Directory",
    code: "Code",
    displayName: "Display Name",
    legalName: "Legal Name",
    targetCap: "Target Cap",
    view: "View",
    navCharities: "Charities",
    navDonors: "Donors",

    // Charity Dashboard
    charityPortal: "Charity Organization Portal",
    licensePrefix: "License",
    approved: "✓ Approved",
    pendingApproval: "⏳ Pending Approval",
    searchBeneficiaries: "Search Beneficiaries",
    totalContributedCharity: "Total Contributed",
    transactionsLabel: "Transactions",
    familiesReached: "Families Reached",
    activeCasesNeedingSupport: "Active Cases Needing Support",
    allCasesFullySupported: "All cases are fully supported!",
    contributionHistory: "Contribution History",
    noContributions: "No contributions yet.",

    // Donate Page
    backToCaseProfile: "Back to Case Profile",
    contributeTo: "Contribute to",
    secureTransaction: "Simulated secure Sadaqah transaction flow",
    remaining: "Remaining",
    cash: "Cash",
    resource: "Resource",
    amountEgp: "Amount (EGP)",
    estimatedValue: "Estimated Value (EGP)",
    resourceType: "Resource Type",
    quantity: "Quantity",
    notesOptional: "Notes (Optional)",
    confirmDonation: "Confirm Donation",
    jazakAllahu: "Jazakallahu Khairan!",
    donationSuccess: "Your contribution has been recorded successfully. The beneficiary will be notified.",
    backToDashboard: "Back to Dashboard",
    viewProfile: "View Profile",

    // Beneficiary Profile (Donor View)
    backToDashboardLink: "Back to Dashboard",
    categoryLabel: "Category",
    fullyCovered: "Fully Covered",
    approxLocation: "Neighborhood (Approx. Location)",
    verifiedProfile: "Verified Needs Profile",
    monthlyTrackerTitle: "Monthly Required Support Tracker",
    receivedSoFar: "Received So Far",
    remainingGap: "Remaining Gap",
    monthlyTargetCap: "Monthly Target Cap",
    caseBackground: "Case Background & Social Worker Notes",
    contributeSupportFunds: "Contribute Support Funds",
    fullyFundedThisMonth: "This beneficiary has already received the full eligible monthly support for this month.",
    openChat: "Open Chat",
    caseNotFound: "Case profile not found",
    caseNotFoundDesc: "This profile is not active, pending approval, or has been hidden by admins.",
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
    confirmed: "مؤكد",
    cancelled: "ملغي",
    rejected: "مرفوض",
    en_route: "جاري التوصيل",
    transactions: "المعاملات",
    
    // Landing Page
    heroTitle: "عوكمة وإدارة الصدقات بشفافية تامّة",
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

    // Dashboards Common & Donor
    welcomeBack: "الحمد لله، مرحباً بعودتك",
    welcomeName: "مرحباً بك",
    donorPrivacyNotice: "يتم تتبع تبرعاتك بشفافية تامة مع إخفاء الإحداثيات الجغرافية الدقيقة حمايةً لخصوصية المستفيدين.",
    discoverCases: "استكشف الحالات القريبة منك",
    totalContributed: "إجمالي مساهماتك",
    directSupportFunds: "أموال دعم مباشر",
    confirmedPending: "التبرعات المؤكدة والمعلقة",
    directImpact: "الأثر المباشر",
    familiesSupported: "أسر تم دعمها",
    activeUrgentCases: "حالات الدعم العاجل النشطة",
    browseMap: "تصفح الخريطة",
    allTargetsCovered: "تم تغطية جميع أهداف الدعم الشهري بالكامل!",
    viewDetails: "عرض التفاصيل",
    support: "تقديم الدعم",
    contributionsHistory: "سجل مساهماتك",
    noDonationsYet: "لم تقم بأي تبرعات بعد.",
    startExploring: "ابدأ باستكشاف الحالات المحلية الموثقة بالقرب منك.",
    uniqueCasesSupported: "عائلات مميزة تم دعمها",

    // Beneficiary Dashboard
    caseId: "رقم الحالة",
    chatRoom: "غرفة المحادثة",
    pendingAuditTitle: "الحساب قيد تدقيق الحوكمة",
    pendingAuditDesc: "المستندات التي قمت بتقديمها قيد المراجعة حالياً من قبل مشرفي المنصة. بمجرد اكتمال التحقق وتغيير حالة ملفك الشخصي إلى 'مقبول'، ستصبح قابلاً للبحث من قبل المتبرعين والجمعيات المحلية.",
    rejectedTitle: "تم رفض الطلب",
    rejectedDesc: "للأسف، تم رفض طلب تقييم الاحتياجات الخاص بك لأنه لم يستوف معايير المنصة أو يحتوي على معلومات غير صحيحة. يرجى التواصل مع الدعم الفني للمزيد من التفاصيل.",
    monthlySupportTracker: "متتبع الدعم الشهري",
    currentMonth: "الشهر الحالي",
    progressToTarget: "التقدم نحو الهدف",
    percentMet: "مستوفى",
    monthlyCapTarget: "الحد الأقصى المستهدف شهرياً",
    receivedAid: "الدعم المستلم",
    remainingNeeded: "المتبقي المطلوب",
    socioEconomicScore: "مؤشر الوضع الاجتماعي والاقتصادي",
    assignedBracket: "الفئة المحددة",
    extremelyVulnerable: "وضع حرج جداً",
    veryNeedy: "بحاجة شديدة",
    needy: "بحاجة للدعم",
    limitedSupport: "حاجة محدودة",
    familyMembers: "أفراد الأسرة",
    childrenUnder18: "الأطفال دون 18 عاماً",
    employmentStatus: "حالة العمل",
    rentBurden: "عبء الإيجار",
    contributionsLedger: "دفتر المساهمات المالية",
    noContributionsYet: "لا توجد مساهمات مسجلة لحالتك بعد.",
    source: "المصدر",
    amount: "المبلغ",
    resourceDistributions: "سجل المساعدات العينية المستلمة",
    noResourcesYet: "لا توجد كراتين أو مساعدات عينية مرسلة إلى عنوانك بعد.",
    itemType: "نوع المادة",
    qty: "الكمية",
    notifications: "الإشعارات والتنبيهات",
    noNotifications: "لا توجد تنبيهات في صندوق الوارد.",

    // Reports Dashboard
    governanceEngine: "محرك حوكمة المنصة",
    auditLogsAnalytics: "سجل عمليات الحوكمة والتحليلات",
    charityLogsDesc: "مراجعة سجلات النشاط وتحليلات الدعم الخاصة بجمعيتك.",
    adminLogsDesc: "الإشراف على توجيه التبرعات، حدود الدعم، وسجلات التدقيق على مستوى المنصة.",
    beneficiaryReach: "الوصول للمستفيدين",
    approvedActiveCases: "الحالات النشطة المعتمدة",
    cashSupportLedger: "سجل الدعم المالي",
    directDonationsProcessed: "تبرع مالي مباشر تم معالجته",
    physicalAidValue: "قيمة المساعدات العينية",
    distributionsCompleted: "عمليات توزيع عيني تم إكمالها",
    totalAidValueRouted: "إجمالي قيمة المساعدات الموجهة",
    directSupportLogistics: "قيمة الدعم المباشر والخدمات اللوجستية",
    vulnerabilityRatio: "نسب الفئات المستحقة",
    scoringDefinition: "تعريف التقييم",
    scoringDefinitionDesc: "يتم حساب فئات الاستحقاق ديناميكياً بناءً على حالة الأسرة، مستوى الدخل، الديون، المشاكل الصحية، وظروف السكن.",
    auditTrail: "سجل تدقيق عمليات الحوكمة (آخر 50 إجراء)",
    timestamp: "التوقيت",
    actionEvent: "الحدث / الإجراء",
    operator: "المنفذ",
    operatorDetails: "التفاصيل",
    noAuditLogs: "لا توجد سجلات تدقيق تطابق المعايير.",

    // Resource Logistics
    resourceLogisticsPortal: "بوابة الخدمات اللوجستية والمساعدات العينية",
    resourceLogisticsDesc: "تتبع والتحقق من توزيع الموارد العينية (كراتين الطعام، الأدوية، المستلزمات) للأسر المستفيدة المسجلة.",
    noResourceDistributions: "لا توجد عمليات توزيع عيني مسجلة",
    noResourceDistributionsDesc: "لا توجد عمليات تسليم بضائع عينية معلقة أو مكتملة في النظام.",
    resourceItem: "المادة العينية",
    beneficiaryFamily: "الأسرة المستفيدة",
    logisticsValue: "القيمة اللوجستية",
    estimatedMarketValue: "القيمة السوقية التقديرية",
    assignedDate: "تاريخ التكليف",
    distributingEntity: "الجهة الموزعة",
    logisticsNotes: "ملاحظات لوجستية",
    updateLogisticsStatus: "تحديث حالة التسليم",
    statusNotes: "ملاحظات الحالة",
    addTrackingNotes: "إضافة ملاحظات تتبع...",
    deliveryStatus: "حالة التوصيل",
    enRoute: "جاري التوصيل",
    deliveryFailed: "فشل التوصيل",
    refReferenceId: "الرقم المرجعي / المعرف",
    refBeneficiary: "المستفيد",
    refSourceContributor: "الجهة المساهمة",
    refTypeParticulars: "النوع والتفاصيل",
    refValueEgp: "القيمة (جنيه)",

    // Admin Dashboard
    systemAdmin: "إدارة النظام",
    adminWelcome: "أهلاً بعودتك",
    adminTagline: "طبقة الحوكمة: فحص حدود الصدقات، مراجعة الحالات، وحماية المنصة.",
    adminCore: "النواة الإدارية",
    cases: "الحالات",
    pendingVerification: "بانتظار التحقق",
    totalRaised: "إجمالي المُجمَّع",
    acrossCashResources: "عبر الدعم النقدي والعيني",
    charities: "الجمعيات",
    pendingLicensing: "بانتظار مراجعة الترخيص",
    donors: "المتبرعون",
    activeContributors: "المساهمون النشطون",
    approvalQueue: "طابور الموافقة",
    auditCase: "مراجعة الحالة",
    verificationQueueClear: "طابور التحقق فارغ",
    verificationQueueClearDesc: "تمت مراجعة جميع الملفات المسجلة.",
    recentAuditLog: "سجل التدقيق الأخير",
    beneficiariesDirectory: "دليل المستفيدين",
    code: "الكود",
    displayName: "الاسم المعروض",
    legalName: "الاسم القانوني",
    targetCap: "الحد الأقصى",
    view: "عرض",
    navCharities: "الجمعيات",
    navDonors: "المتبرعون",

    // Charity Dashboard
    charityPortal: "بوابة الجمعية الخيرية",
    licensePrefix: "الترخيص",
    approved: "✓ معتمدة",
    pendingApproval: "⏳ بانتظار الاعتماد",
    searchBeneficiaries: "بحث المستفيدين",
    totalContributedCharity: "إجمالي المساهمات",
    transactionsLabel: "المعاملات",
    familiesReached: "أسر تم الوصول إليها",
    activeCasesNeedingSupport: "الحالات النشطة التي تحتاج دعماً",
    allCasesFullySupported: "جميع الحالات مغطاة بالكامل!",
    contributionHistory: "سجل المساهمات",
    noContributions: "لا توجد مساهمات بعد.",

    // Donate Page
    backToCaseProfile: "العودة لملف الحالة",
    contributeTo: "التبرع لحالة",
    secureTransaction: "معاملة صدقة آمنة محاكاة",
    remaining: "المتبقي",
    cash: "نقدي",
    resource: "عيني",
    amountEgp: "المبلغ (جنيه)",
    estimatedValue: "القيمة التقديرية (جنيه)",
    resourceType: "نوع المساعدة",
    quantity: "الكمية",
    notesOptional: "ملاحظات (اختياري)",
    confirmDonation: "تأكيد التبرع",
    jazakAllahu: "جزاكم الله خيراً!",
    donationSuccess: "تم تسجيل مساهمتك بنجاح. سيتم إخطار المستفيد.",
    backToDashboard: "العودة للوحة التحكم",
    viewProfile: "عرض الملف الشخصي",

    // Beneficiary Profile (Donor View)
    backToDashboardLink: "العودة للوحة التحكم",
    categoryLabel: "الفئة",
    fullyCovered: "مغطى بالكامل",
    approxLocation: "الحي (موقع تقريبي)",
    verifiedProfile: "ملف احتياجات موثق",
    monthlyTrackerTitle: "متتبع الدعم الشهري المطلوب",
    receivedSoFar: "المستلم حتى الآن",
    remainingGap: "الفجوة المتبقية",
    monthlyTargetCap: "الحد الأقصى الشهري المستهدف",
    caseBackground: "خلفية الحالة وملاحظات الأخصائي الاجتماعي",
    contributeSupportFunds: "تقديم دعم مالي",
    fullyFundedThisMonth: "هذا المستفيد استلم بالفعل الدعم الشهري كاملاً لهذا الشهر.",
    openChat: "فتح المحادثة",
    caseNotFound: "ملف الحالة غير موجود",
    caseNotFoundDesc: "هذا الملف غير نشط أو بانتظار الموافقة أو تم إخفاؤه من قبل المشرفين.",
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

  // Load language preference from cookie/local storage on mount
  useEffect(() => {
    const match = document.cookie.match(/(^| )language=([^;]+)/);
    const saved = (match ? match[2] : localStorage.getItem('language')) as Language;
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
    document.cookie = `language=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
    window.location.reload(); // Reload page to update server components immediately
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
