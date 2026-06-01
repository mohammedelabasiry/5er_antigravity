export interface EvaluationInputs {
  monthlyIncome: number;
  familyMembersCount: number;
  childrenCount: number;
  employmentStatus: string; // "unemployed", "part-time", "retired", "full-time"
  medicalConditions: string; // text description
  housingStatus: string; // "rented", "shared", "owned"
  debtObligations: number; // in EGP
  urgentNeeds: string; // text description
  existingSupport: number; // in EGP
}

export interface EvaluationResult {
  score: number;
  category: 'A' | 'B' | 'C' | 'D';
  recommendedAmount: number;
  breakdown: {
    incomeScore: number;
    dependentsScore: number;
    employmentScore: number;
    medicalScore: number;
    housingScore: number;
    needsScore: number;
  };
}

export function calculateScoreAndCategory(inputs: EvaluationInputs): EvaluationResult {
  let incomeScore = 0;
  let dependentsScore = 0;
  let employmentScore = 0;
  let medicalScore = 0;
  let housingScore = 0;
  let needsScore = 0;

  // 1. Income level (Max 30 points)
  const income = Number(inputs.monthlyIncome) || 0;
  if (income === 0) {
    incomeScore = 30;
  } else if (income < 2000) {
    incomeScore = 20;
  } else if (income < 4000) {
    incomeScore = 10;
  } else if (income < 6000) {
    incomeScore = 5;
  } else {
    incomeScore = 0;
  }

  // 2. Family Members & Children (Max 20 points)
  const members = Number(inputs.familyMembersCount) || 1;
  const children = Number(inputs.childrenCount) || 0;
  
  if (members >= 5) {
    dependentsScore += 10;
  } else if (members >= 3) {
    dependentsScore += 5;
  } else {
    dependentsScore += 2;
  }

  if (children > 3) {
    dependentsScore += 10;
  } else if (children >= 1) {
    dependentsScore += 5;
  }

  // Cap dependents score at 20
  dependentsScore = Math.min(dependentsScore, 20);

  // 3. Employment Status (Max 10 points)
  const emp = (inputs.employmentStatus || '').toLowerCase();
  if (emp.includes('unemployed') || emp === 'no work' || emp === 'none') {
    employmentScore = 10;
  } else if (emp.includes('retired') || emp.includes('disabled') || emp.includes('elderly')) {
    employmentScore = 8;
  } else if (emp.includes('part-time') || emp.includes('casual') || emp.includes('seasonal') || emp.includes('sewing') || emp.includes('laborer')) {
    employmentScore = 5;
  } else {
    employmentScore = 0;
  }

  // 4. Medical Conditions (Max 15 points)
  const med = (inputs.medicalConditions || '').toLowerCase();
  if (
    med.includes('severe') ||
    med.includes('cancer') ||
    med.includes('renal') ||
    med.includes('kidney') ||
    med.includes('dialysis') ||
    med.includes('heart') ||
    med.includes('cardio') ||
    med.includes('blind') ||
    med.includes('paralysis') ||
    med.includes('disabled')
  ) {
    medicalScore = 15;
  } else if (
    med.includes('moderate') ||
    med.includes('diabetes') ||
    med.includes('hypertension') ||
    med.includes('pressure') ||
    med.includes('asthma') ||
    med.includes('sick') ||
    med.includes('chronic')
  ) {
    medicalScore = 8;
  } else if (med.trim().length > 3) {
    medicalScore = 5;
  } else {
    medicalScore = 0;
  }

  // 5. Housing rent burden and debt obligations (Max 15 points)
  const house = (inputs.housingStatus || '').toLowerCase();
  const debt = Number(inputs.debtObligations) || 0;
  
  if (house.includes('rented') || house.includes('shared')) {
    if (debt > 5000) {
      housingScore = 15;
    } else {
      housingScore = 10;
    }
  } else {
    // Owned
    if (debt > 5000) {
      housingScore = 5;
    } else {
      housingScore = 0;
    }
  }

  // 6. Urgent Need & Existing Support (Max 10 points)
  const urgent = (inputs.urgentNeeds || '').trim().length > 3;
  const support = Number(inputs.existingSupport) || 0;

  if (urgent && support === 0) {
    needsScore = 10;
  } else if (urgent || support === 0) {
    needsScore = 5;
  } else {
    needsScore = 0;
  }

  const score = incomeScore + dependentsScore + employmentScore + medicalScore + housingScore + needsScore;
  const finalScore = Math.min(Math.max(score, 0), 100);

  // Map to Category and Recommend Support Amount (EGP)
  let category: 'A' | 'B' | 'C' | 'D' = 'D';
  let recommendedAmount = 1500;

  if (finalScore >= 85) {
    category = 'A';
    recommendedAmount = 7000;
  } else if (finalScore >= 70) {
    category = 'B';
    recommendedAmount = 5000;
  } else if (finalScore >= 50) {
    category = 'C';
    recommendedAmount = 3000;
  } else if (finalScore >= 30) {
    category = 'D';
    recommendedAmount = 1500;
  } else {
    category = 'D';
    recommendedAmount = 1000;
  }

  return {
    score: finalScore,
    category,
    recommendedAmount,
    breakdown: {
      incomeScore,
      dependentsScore,
      employmentScore,
      medicalScore,
      housingScore,
      needsScore,
    },
  };
}
