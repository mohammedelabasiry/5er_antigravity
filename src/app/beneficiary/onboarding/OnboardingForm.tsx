'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ChevronRight, ChevronLeft, ShieldCheck, Heart, User, Sparkles, Upload, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

const AREAS = [
  { name: 'Downtown Cairo', nameAr: 'وسط البلد، القاهرة', lat: 30.0480, lng: 31.2330 },
  { name: 'Garden City', nameAr: 'جاردن سيتي', lat: 30.0400, lng: 31.2400 },
  { name: 'Zamalek', nameAr: 'الزمالك', lat: 30.0520, lng: 31.2280 },
  { name: 'Dokki', nameAr: 'الدقي', lat: 30.0250, lng: 31.2200 },
  { name: 'Mohandessin', nameAr: 'المهندسين', lat: 30.0650, lng: 31.2600 },
  { name: 'Giza', nameAr: 'الجيزة', lat: 30.0800, lng: 31.2000 },
  { name: 'Sayeda Zeinab', nameAr: 'السيدة زينب', lat: 30.0350, lng: 31.2500 },
  { name: 'Nasr City', nameAr: 'مدينة نصر', lat: 30.0100, lng: 31.2900 },
  { name: 'Heliopolis', nameAr: 'مصر الجديدة', lat: 30.0950, lng: 31.3100 },
  { name: 'Maadi', nameAr: 'المعادي', lat: 29.9800, lng: 31.2700 },
];

const onboardingTranslations = {
  en: {
    title: "Onboarding Needs Evaluation",
    subtitle: "Complete the 4-step assessment to establish your verified support cap.",
    step1: "Public Info",
    step2: "Private verification",
    step3: "Financial status",
    step4: "Documents",
    step1Title: "Step 1: Public Dignified Identity",
    step1Desc: "Donors and public users will only see this anonymized data. Your private information (e.g. legal name, exact address) is strictly hidden.",
    displayNameLabel: "Display Name (Safe display name or nickname)",
    generalAreaLabel: "General Location Area",
    neighborhoodCoords: "Neighborhood Coordinates",
    approxLocation: "Approximate Location",
    showOnMapLabel: "Show my location and case on the public discovery map",
    showOnMapDesc: "If enabled, donors can find your case approximately on the map. Your exact location is always hidden.",
    caseSummaryLabel: "Case Summary / Story (Describe your needs respectfully)",
    caseSummaryPlaceholder: "Write a brief, respectful summary of your family status, what you need support for (e.g. children school fees, rent assistance, medical prescriptions) without including private details.",
    step2Title: "Step 2: Private Verification Details",
    step2Desc: "IMPORTANT: The details in this section are highly confidential and will only be visible to administrators for validation.",
    legalNameLabel: "Legal Full Name",
    nationalIdLabel: "14-Digit National ID",
    privatePhoneLabel: "Private Contact Phone Number",
    exactAddressLabel: "Exact Legal Home Address",
    step3Title: "Step 3: Socio-Economic Need Factors",
    step3Desc: "These factors run through our need assessment scoring engine to automatically calculate your category bracket. Be honest, all values will be cross-referenced against your uploaded documents.",
    monthlyIncomeLabel: "Monthly Income (EGP)",
    familyMembersLabel: "Family Members Count",
    childrenLabel: "Children Count",
    employmentLabel: "Employment Status",
    housingLabel: "Housing Status",
    otherSupportLabel: "Monthly Support from others (EGP)",
    outstandingDebtLabel: "Total Outstanding Debt (EGP)",
    chronicIllnessLabel: "Chronic Illness / Medical Condition Details",
    medicalPlaceholder: "e.g. Renal failure, severe heart condition, diabetes, none",
    urgentNeedsLabel: "Urgent Medical or Food Needs (Description)",
    urgentNeedsPlaceholder: "Mention any urgent needs (e.g. immediate surgery cost, risk of eviction, lack of food, etc.)...",
    step4Title: "Step 4: Attach Verification Documents",
    step4Desc: "Upload clear photos or PDF scans of your files. The system runs in secure sandboxed local storage, protecting documents from donor exposure.",
    docNationalId: "National ID Card (Front/Back scan)",
    docProofAddress: "Proof of Address (Utility bill or Rental contract)",
    docIncomeProof: "Income Proof / Salary Slip (Optional)",
    docMedicalReport: "Medical Reports / Doctor Certificates (Optional)",
    noFileAttached: "No file attached yet.",
    fileAttached: "Attached",
    removeFile: "Remove",
    simulateAttach: "Simulate Attach File",
    previousBtn: "Previous",
    nextBtn: "Next Step",
    submitBtn: "Submit Needs Evaluation",
    valStep1: "Please enter a display name and respectful case summary.",
    valStep1Length: "Please write a brief summary of at least 20 characters describing the case.",
    valStep2: "Please fill in all private verification details.",
    valStep2Length: "National ID must be exactly 14 digits.",
    valStep3: "Family member count must be at least 1.",
    valStep4: "You must attach at least a National ID and Proof of Address for verification.",
    submissionFailed: "Onboarding submission failed.",
    submissionError: "An error occurred during submission."
  },
  ar: {
    title: "تقييم الاحتياجات لتسجيل البيانات",
    subtitle: "أكمل التقييم المكون من 4 خطوات لتحديد الحد الأقصى للدعم المعتمد الخاص بك.",
    step1: "البيانات العامة",
    step2: "التحقق الخاص",
    step3: "الوضع المالي",
    step4: "المستندات والأوراق",
    step1Title: "الخطوة 1: الهوية العامة المصونة",
    step1Desc: "سيرى المتبرعون والجمهور هذه البيانات المعماة فقط. معلوماتك الخاصة (مثل الاسم القانوني، العنوان الدقيق) مخفية تماماً.",
    displayNameLabel: "الاسم المعروض (اسم عام آمن أو لقب للتعريف)",
    generalAreaLabel: "منطقة السكن العامة",
    neighborhoodCoords: "إحداثيات الحي السكني",
    approxLocation: "موقع تقريبي",
    showOnMapLabel: "إظهار موقعي وحالتي على خريطة الاستكشاف العامة",
    showOnMapDesc: "إذا تم التفعيل، يمكن للمتبرعين العثور على حالتك بشكل تقريبي على الخريطة. يظل موقعك الدقيق مخفياً دائماً.",
    caseSummaryLabel: "ملخص الحالة / القصة (يرجى شرح احتياجاتك بكرامة)",
    caseSummaryPlaceholder: "اكتب ملخصاً وجيزاً عن وضع أسرتك، وما تحتاج الدعم لأجله (مثل مصاريف المدارس، دعم الإيجار، الروشتات العلاجية) دون كتابة أي تفاصيل خاصة بك أو بعائلتك.",
    step2Title: "الخطوة 2: بيانات التحقق الخاصة",
    step2Desc: "هام جداً: البيانات في هذا القسم سرية للغاية ولن تكون مرئية إلا لمراجعي المنصة للتحقق وتأكيد أهلية الحالة.",
    legalNameLabel: "الاسم القانوني الكامل",
    nationalIdLabel: "الرقم القومي (14 رقماً)",
    privatePhoneLabel: "رقم هاتف التواصل الخاص",
    exactAddressLabel: "العنوان السكني الدقيق (القانوني)",
    step3Title: "الخطوة 3: مؤشرات الوضع الاجتماعي والاقتصادي",
    step3Desc: "تمر هذه المؤشرات عبر محرك تقييم الاحتياجات لحساب الفئة المستحقة تلقائياً. يرجى الصدق في ملء البيانات، حيث سيتم مطابقتها مع المستندات المرفقة.",
    monthlyIncomeLabel: "الدخل الشهري (جنيه)",
    familyMembersLabel: "عدد أفراد الأسرة",
    childrenLabel: "عدد الأطفال",
    employmentLabel: "الحالة المهنية",
    housingLabel: "حالة السكن",
    otherSupportLabel: "المساعدات الشهرية المستلمة من جهات أخرى (جنيه)",
    outstandingDebtLabel: "إجمالي الديون والالتزامات المالية (جنيه)",
    chronicIllnessLabel: "الأمراض المزمنة / تفاصيل الحالة الصحية",
    medicalPlaceholder: "مثال: فشل كلوي، مرض بالقلب، سكر، لا يوجد",
    urgentNeedsLabel: "احتياجات طبية أو غذائية عاجلة (شرح)",
    urgentNeedsPlaceholder: "اذكر أي احتياجات عاجلة جداً (مثل تكلفة عملية فورية، خطر الطرد من السكن، نقص الغذاء، إلخ)...",
    step4Title: "الخطوة 4: إرفاق وثائق ومستندات التحقق",
    step4Desc: "يرجى إرفاق صور واضحة أو ملفات PDF لمستنداتك. يعمل النظام ببيئة تخزين محلية آمنة تحمي أوراقك تماماً من أي اطلاع من المتبرعين.",
    docNationalId: "بطاقة الرقم القومي (صورة الوجه والخلفية)",
    docProofAddress: "إثبات محل السكن (إيصال مرافق أو عقد إيجار)",
    docIncomeProof: "إثبات الدخل / مفردات مرتب (اختياري)",
    docMedicalReport: "التقارير الطبية والشهادات الصحية (اختياري)",
    noFileAttached: "لم يتم إرفاق أي ملف بعد.",
    fileAttached: "تم إرفاق ملف",
    removeFile: "إزالة",
    simulateAttach: "محاكاة إرفاق ملف",
    previousBtn: "الخطوة السابقة",
    nextBtn: "الخطوة التالية",
    submitBtn: "تقديم تقييم الاحتياجات",
    valStep1: "يرجى كتابة الاسم المعروض وملخص الحالة.",
    valStep1Length: "يرجى كتابة ملخص حالة لا يقل عن 20 حرفاً لوصف الظروف المعيشية.",
    valStep2: "يرجى تعبئة كافة بيانات التحقق الخاصة.",
    valStep2Length: "يجب أن يتكون الرقم القومي من 14 رقماً بالضبط.",
    valStep3: "يجب أن يكون عدد أفراد الأسرة 1 على الأقل.",
    valStep4: "يجب إرفاق بطاقة الرقم القومي وإثبات السكن على الأقل للتحقق من أهليتكم.",
    submissionFailed: "فشل تقديم طلب التسجيل.",
    submissionError: "حدث خطأ غير متوقع أثناء التقديم."
  }
};

interface OnboardingFormProps {
  initialProfile: {
    displayName: string;
    fullName: string;
    nationalId: string;
    phone: string;
    address: string;
    areaName: string;
  } | null;
}

export default function OnboardingForm({ initialProfile }: OnboardingFormProps) {
  const router = useRouter();
  const { language, isRtl } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ot = (key: keyof typeof onboardingTranslations['en']) => {
    return onboardingTranslations[language]?.[key] || onboardingTranslations['en'][key];
  };

  const initialAreaIndex = initialProfile 
    ? AREAS.findIndex(a => a.name === initialProfile.areaName || a.nameAr === initialProfile.areaName)
    : 0;
  const safeAreaIndex = initialAreaIndex !== -1 ? initialAreaIndex : 0;

  // Form State
  const [displayName, setDisplayName] = useState(initialProfile?.displayName || (language === 'ar' ? 'حالة دعم أسري' : 'Family Support Case'));
  const [caseSummary, setCaseSummary] = useState('');
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(safeAreaIndex);
  const [showOnMap, setShowOnMap] = useState(true);

  const [fullName, setFullName] = useState(initialProfile?.fullName || '');
  const [nationalId, setNationalId] = useState(initialProfile?.nationalId || '');
  const [address, setAddress] = useState(initialProfile?.address || '');
  const [phone, setPhone] = useState(initialProfile?.phone || '');

  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [familyMembersCount, setFamilyMembersCount] = useState<number>(1);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [employmentStatus, setEmploymentStatus] = useState('Unemployed');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [housingStatus, setHousingStatus] = useState('Rented');
  const [debtObligations, setDebtObligations] = useState<number>(0);
  const [urgentNeeds, setUrgentNeeds] = useState('');
  const [existingSupport, setExistingSupport] = useState<number>(0);

  // Mock Uploaded Documents state
  const [documents, setDocuments] = useState<Array<{ type: string; name: string }>>([]);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  const handleAddMockFile = (type: string, filename: string) => {
    setUploadingDocType(type);
    setTimeout(() => {
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.type !== type);
        return [...filtered, { type, name: filename }];
      });
      setUploadingDocType(null);
    }, 600);
  };

  const handleRemoveDoc = (type: string) => {
    setDocuments((prev) => prev.filter((d) => d.type !== type));
  };

  const validateStep = () => {
    setError(null);
    if (step === 1) {
      if (!displayName || !caseSummary) {
        setError(ot('valStep1'));
        return false;
      }
      if (caseSummary.length < 20) {
        setError(ot('valStep1Length'));
        return false;
      }
    } else if (step === 2) {
      if (!fullName || !nationalId || !address || !phone) {
        setError(ot('valStep2'));
        return false;
      }
      if (nationalId.length !== 14 || !/^\d+$/.test(nationalId)) {
        setError(ot('valStep2Length'));
        return false;
      }
    } else if (step === 3) {
      if (familyMembersCount < 1) {
        setError(ot('valStep3'));
        return false;
      }
    } else if (step === 4) {
      const hasNationalId = documents.some((d) => d.type === 'NATIONAL_ID');
      const hasProofOfAddress = documents.some((d) => d.type === 'PROOF_OF_ADDRESS');
      if (!hasNationalId || !hasProofOfAddress) {
        setError(ot('valStep4'));
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError(null);

    const area = AREAS[selectedAreaIndex];

    try {
      const response = await fetch('/api/beneficiary/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          caseSummary,
          areaName: area.name,
          latitude: area.lat,
          longitude: area.lng,
          showOnMap,
          fullName,
          nationalId,
          address,
          phone,
          monthlyIncome,
          familyMembersCount,
          childrenCount,
          employmentStatus,
          medicalConditions,
          housingStatus,
          debtObligations,
          urgentNeeds,
          existingSupport,
          mockDocs: documents,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || ot('submissionFailed'));
      }

      router.refresh();
      router.push('/beneficiary/dashboard');
    } catch (err: any) {
      setError(err.message || ot('submissionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white border border-slate-100 shadow-xl shadow-slate-100 rounded-3xl overflow-hidden ${isRtl ? 'text-right' : 'text-left'}`}>
      {/* Top Gradient Banner */}
      <div className={`bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white ${isRtl ? 'text-right' : 'text-left'}`}>
        <h2 className={`text-xl sm:text-2xl font-bold flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <Sparkles className="w-5 sm:w-6 h-5 sm:h-6" />
          {ot('title')}
        </h2>
        <p className="text-emerald-50 text-xs sm:text-sm mt-1">
          {ot('subtitle')}
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className={`flex border-b border-slate-100 bg-slate-50/50 p-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
        {[
          { num: 1, label: ot('step1') },
          { num: 2, label: ot('step2') },
          { num: 3, label: ot('step3') },
          { num: 4, label: ot('step4') },
        ].map((s) => (
          <div key={s.num} className="flex-1 flex flex-col items-center relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                step >= s.num
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`text-[10px] sm:text-xs font-semibold mt-1.5 transition-colors hidden sm:block ${
                step >= s.num ? 'text-emerald-800' : 'text-slate-400'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Form Error Message */}
      {error && (
        <div className={`m-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs sm:text-sm rounded-2xl flex items-start gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Content */}
      <div className="p-6 sm:p-8">
        {/* Step 1: Public Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className={`text-lg font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Heart className="text-emerald-600 w-5 h-5" />
              {ot('step1Title')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {ot('step1Desc')}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                {ot('displayNameLabel')}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Family Support Case"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
              />
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6`}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('generalAreaLabel')}
                </label>
                <select
                  value={selectedAreaIndex}
                  onChange={(e) => setSelectedAreaIndex(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                >
                  {AREAS.map((area, index) => (
                    <option key={area.name} value={index}>
                      {language === 'ar' ? area.nameAr : area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div>
                  <p className="font-semibold text-slate-700">{ot('neighborhoodCoords')}</p>
                  <p className="text-slate-400 mt-0.5">
                    Lat: {AREAS[selectedAreaIndex].lat.toFixed(4)}, Lng:{' '}
                    {AREAS[selectedAreaIndex].lng.toFixed(4)}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-medium rounded border border-emerald-100">
                  {ot('approxLocation')}
                </span>
              </div>
            </div>

            {/* Map Visibility Toggle */}
            <div className={`p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <input
                type="checkbox"
                id="showOnMap"
                checked={showOnMap}
                onChange={(e) => setShowOnMap(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 accent-emerald-600 cursor-pointer"
              />
              <label htmlFor="showOnMap" className="space-y-0.5 cursor-pointer select-none">
                <span className="text-xs font-bold text-slate-800 block">
                  {ot('showOnMapLabel')}
                </span>
                <span className="text-[11px] text-slate-500 block leading-normal">
                  {ot('showOnMapDesc')}
                </span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                {ot('caseSummaryLabel')}
              </label>
              <textarea
                required
                value={caseSummary}
                onChange={(e) => setCaseSummary(e.target.value)}
                placeholder={ot('caseSummaryPlaceholder')}
                rows={5}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Private Verification */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className={`text-lg font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <User className="text-emerald-600 w-5 h-5" />
              {ot('step2Title')}
            </h3>
            <p className="text-xs text-rose-600 leading-relaxed font-semibold bg-rose-55 p-3 rounded-xl border border-rose-100">
              {ot('step2Desc')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('legalNameLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={language === 'ar' ? "محمد علي حسن" : "Mohamed Ali Hassan"}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('nationalIdLabel')}
                </label>
                <input
                  type="text"
                  maxLength={14}
                  required
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="28012010103214"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('privatePhoneLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+201012345678"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('exactAddressLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={language === 'ar' ? "شقة 4، الطابق 3، عمارة 12، شارع النيل" : "Apartment 4, Floor 3, Building 12, Nile Street"}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Financial Status */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className={`text-lg font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <FileText className="text-emerald-600 w-5 h-5" />
              {ot('step3Title')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {ot('step3Desc')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('monthlyIncomeLabel')}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('familyMembersLabel')}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={familyMembersCount}
                  onChange={(e) => setFamilyMembersCount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('childrenLabel')}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('employmentLabel')}
                </label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                >
                  <option value="Unemployed">{language === 'ar' ? 'عاطل عن العمل' : 'Unemployed'}</option>
                  <option value="Part-time">{language === 'ar' ? 'عمل جزئي / غير منتظم' : 'Part-time / Casual Work'}</option>
                  <option value="Retired">{language === 'ar' ? 'متقاعد / مسن' : 'Retired / Elderly'}</option>
                  <option value="Disabled">{language === 'ar' ? 'ذوي الاحتياجات الخاصة / عاجز' : 'Disabled / Unable to work'}</option>
                  <option value="Full-time">{language === 'ar' ? 'عمل بدوام كامل' : 'Full-time Employed'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('housingLabel')}
                </label>
                <select
                  value={housingStatus}
                  onChange={(e) => setHousingStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                >
                  <option value="Rented">{language === 'ar' ? 'إيجار' : 'Rented Apartment'}</option>
                  <option value="Shared">{language === 'ar' ? 'بيت العائلة / مشترك' : 'Shared / Family house'}</option>
                  <option value="Owned">{language === 'ar' ? 'ملك' : 'Owned (Unburdened)'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('otherSupportLabel')}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={existingSupport}
                  onChange={(e) => setExistingSupport(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('outstandingDebtLabel')}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={debtObligations}
                  onChange={(e) => setDebtObligations(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                  {ot('chronicIllnessLabel')}
                </label>
                <input
                  type="text"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder={ot('medicalPlaceholder')}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1">
                {ot('urgentNeedsLabel')}
              </label>
              <textarea
                value={urgentNeeds}
                onChange={(e) => setUrgentNeeds(e.target.value)}
                placeholder={ot('urgentNeedsPlaceholder')}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 4: Documents Upload */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className={`text-lg font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Upload className="text-emerald-600 w-5 h-5" />
              {ot('step4Title')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {ot('step4Desc')}
            </p>

            <div className="space-y-4">
              {[
                { type: 'NATIONAL_ID', label: ot('docNationalId') },
                { type: 'PROOF_OF_ADDRESS', label: ot('docProofAddress') },
                { type: 'INCOME_PROOF', label: ot('docIncomeProof') },
                { type: 'MEDICAL_DOCUMENT', label: ot('docMedicalReport') },
              ].map((docDef) => {
                const uploadedFile = documents.find((d) => d.type === docDef.type);
                const isUploading = uploadingDocType === docDef.type;

                return (
                  <div
                    key={docDef.type}
                    className={`p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isRtl ? 'sm:flex-row-reverse' : ''}`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-700">{docDef.label}</p>
                      {uploadedFile ? (
                        <p className={`text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {ot('fileAttached')}: {uploadedFile.name}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">{ot('noFileAttached')}</p>
                      )}
                    </div>

                    <div>
                      {uploadedFile ? (
                        <button
                           type="button"
                           onClick={() => handleRemoveDoc(docDef.type)}
                           className={`px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {ot('removeFile')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() =>
                            handleAddMockFile(docDef.type, `${docDef.type.toLowerCase()}_mock.pdf`)
                          }
                          className={`px-4 py-2 bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 ${isRtl ? 'flex-row-reverse' : ''}`}
                        >
                          {isUploading ? (
                            <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          {ot('simulateAttach')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stepper Buttons Panel */}
      <div className={`bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className={`px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <ChevronLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            {ot('previousBtn')}
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className={`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-100 ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            {ot('nextBtn')}
            <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              ot('submitBtn')
            )}
          </button>
        )}
      </div>
    </div>
  );
}
