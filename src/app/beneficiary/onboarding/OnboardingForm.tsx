'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ChevronRight, ChevronLeft, ShieldCheck, Heart, User, Sparkles, Upload, Trash2, CheckCircle2 } from 'lucide-react';

const AREAS = [
  { name: 'Downtown Cairo', lat: 30.0480, lng: 31.2330 },
  { name: 'Garden City', lat: 30.0400, lng: 31.2400 },
  { name: 'Zamalek', lat: 30.0520, lng: 31.2280 },
  { name: 'Dokki', lat: 30.0250, lng: 31.2200 },
  { name: 'Mohandessin', lat: 30.0650, lng: 31.2600 },
  { name: 'Giza', lat: 30.0800, lng: 31.2000 },
  { name: 'Sayeda Zeinab', lat: 30.0350, lng: 31.2500 },
  { name: 'Nasr City', lat: 30.0100, lng: 31.2900 },
  { name: 'Heliopolis', lat: 30.0950, lng: 31.3100 },
  { name: 'Maadi', lat: 29.9800, lng: 31.2700 },
];

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('Family Support Case');
  const [caseSummary, setCaseSummary] = useState('');
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);

  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

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
        // Filter out existing document of same type
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
        setError('Please enter a display name and respectful case summary.');
        return false;
      }
      if (caseSummary.length < 20) {
        setError('Please write a brief summary of at least 20 characters describing the case.');
        return false;
      }
    } else if (step === 2) {
      if (!fullName || !nationalId || !address || !phone) {
        setError('Please fill in all private verification details.');
        return false;
      }
      if (nationalId.length !== 14 || !/^\d+$/.test(nationalId)) {
        setError('National ID must be exactly 14 digits.');
        return false;
      }
    } else if (step === 3) {
      if (familyMembersCount < 1) {
        setError('Family member count must be at least 1.');
        return false;
      }
    } else if (step === 4) {
      const hasNationalId = documents.some((d) => d.type === 'NATIONAL_ID');
      const hasProofOfAddress = documents.some((d) => d.type === 'PROOF_OF_ADDRESS');
      if (!hasNationalId || !hasProofOfAddress) {
        setError('You must attach at least a National ID and Proof of Address for verification.');
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
        throw new Error(data.error || 'Onboarding submission failed.');
      }

      router.refresh();
      router.push('/beneficiary/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
      {/* Top Gradient Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white text-left">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 sm:w-6 h-5 sm:h-6" />
          Onboarding Needs Evaluation
        </h2>
        <p className="text-emerald-50 text-xs sm:text-sm mt-1">
          Complete the 4-step assessment to establish your verified support cap.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-4">
        {[
          { num: 1, label: 'Public Info' },
          { num: 2, label: 'Private verification' },
          { num: 3, label: 'Financial status' },
          { num: 4, label: 'Documents' },
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
        <div className="m-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs sm:text-sm rounded-2xl flex items-start gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Content */}
      <div className="p-6 sm:p-8 text-left">
        {/* Step 1: Public Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Heart className="text-emerald-600 w-5 h-5" />
              Step 1: Public Dignified Identity
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Donors and public users will only see this anonymized data. Your private information (e.g. legal name, exact address) is strictly hidden.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Display Name (Safe display name or nickname)
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  General Location Area
                </label>
                <select
                  value={selectedAreaIndex}
                  onChange={(e) => setSelectedAreaIndex(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                >
                  {AREAS.map((area, index) => (
                    <option key={area.name} value={index}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-700">Neighborhood Coordinates</p>
                  <p className="text-slate-400 mt-0.5">
                    Lat: {AREAS[selectedAreaIndex].lat.toFixed(4)}, Lng:{' '}
                    {AREAS[selectedAreaIndex].lng.toFixed(4)}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-medium rounded border border-emerald-100">
                  Approximate Location
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Case Summary / Story (Describe your needs respectfully)
              </label>
              <textarea
                required
                value={caseSummary}
                onChange={(e) => setCaseSummary(e.target.value)}
                placeholder="Write a brief, respectful summary of your family status, what you need support for (e.g. children school fees, rent assistance, medical prescriptions) without including private details."
                rows={5}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Private Verification */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <User className="text-emerald-600 w-5 h-5" />
              Step 2: Private Verification Details
            </h3>
            <p className="text-xs text-rose-600 leading-relaxed font-semibold bg-rose-50 p-3 rounded-xl border border-rose-100">
              IMPORTANT: The details in this section are highly confidential and will only be visible to administrators for validation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Legal Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mohamed Ali Hassan"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  14-Digit National ID
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Private Contact Phone Number
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Exact Legal Home Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Apartment 4, Floor 3, Building 12, Nile Street"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Financial Status */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <FileText className="text-emerald-600 w-5 h-5" />
              Step 3: Socio-Economic Need Factors
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              These factors run through our need assessment scoring engine to automatically calculate your category bracket. Be honest, all values will be cross-referenced against your uploaded documents.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Monthly Income (EGP)
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Family Members Count
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Children Count
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Employment Status
                </label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                >
                  <option value="Unemployed">Unemployed</option>
                  <option value="Part-time">Part-time / Casual Work</option>
                  <option value="Retired">Retired / Elderly</option>
                  <option value="Disabled">Disabled / Unable to work</option>
                  <option value="Full-time">Full-time Employed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Housing Status
                </label>
                <select
                  value={housingStatus}
                  onChange={(e) => setHousingStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                >
                  <option value="Rented">Rented Apartment</option>
                  <option value="Shared">Shared / Family house</option>
                  <option value="Owned">Owned (Unburdened)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Monthly Support from others (EGP)
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Total Outstanding Debt (EGP)
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Chronic Illness / Medical Condition Details
                </label>
                <input
                  type="text"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="e.g. Renal failure, severe heart condition, diabetes, none"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Urgent Medical or Food Needs (Description)
              </label>
              <textarea
                value={urgentNeeds}
                onChange={(e) => setUrgentNeeds(e.target.value)}
                placeholder="Mention any urgent needs (e.g. immediate surgery cost, risk of eviction, lack of food, etc.)..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 4: Documents Upload */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Upload className="text-emerald-600 w-5 h-5" />
              Step 4: Attach Verification Documents
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload clear photos or PDF scans of your files. The system runs in secure sandboxed local storage, protecting documents from donor exposure.
            </p>

            <div className="space-y-4">
              {[
                { type: 'NATIONAL_ID', label: 'National ID Card (Front/Back scan)' },
                { type: 'PROOF_OF_ADDRESS', label: 'Proof of Address (Utility bill or Rental contract)' },
                { type: 'INCOME_PROOF', label: 'Income Proof / Salary Slip (Optional)' },
                { type: 'MEDICAL_DOCUMENT', label: 'Medical Reports / Doctor Certificates (Optional)' },
              ].map((docDef) => {
                const uploadedFile = documents.find((d) => d.type === docDef.type);
                const isUploading = uploadingDocType === docDef.type;

                return (
                  <div
                    key={docDef.type}
                    className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-700">{docDef.label}</p>
                      {uploadedFile ? (
                        <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Attached: {uploadedFile.name}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">No file attached yet.</p>
                      )}
                    </div>

                    <div>
                      {uploadedFile ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(docDef.type)}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() =>
                            handleAddMockFile(docDef.type, `${docDef.type.toLowerCase()}_mock.pdf`)
                          }
                          className="px-4 py-2 bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                        >
                          {isUploading ? (
                            <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          Simulate Attach File
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
      <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between items-center">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-100"
          >
            Next Step
            <ChevronRight className="w-4 h-4" />
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
              'Submit Needs Evaluation'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
