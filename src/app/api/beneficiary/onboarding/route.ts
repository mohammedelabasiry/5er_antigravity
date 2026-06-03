import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateScoreAndCategory } from '@/lib/evaluation';
import { BeneficiaryStatus, DocumentType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'BENEFICIARY') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const existingProfile = await prisma.beneficiaryProfile.findUnique({
      where: { userId: session.userId },
    });

    if (existingProfile && existingProfile.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Profile already submitted' }, { status: 400 });
    }

    const body = await request.json();
    const {
      displayName,
      caseSummary,
      areaName,
      latitude,
      longitude,
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
      mockDocs,
    } = body;

    // Mandatory fields check
    if (!displayName || !caseSummary || !areaName || !fullName || !nationalId || !address || !phone) {
      return NextResponse.json({ error: 'Please fill in all required fields' }, { status: 400 });
    }

    // National ID uniqueness check
    const existingNatId = await prisma.beneficiaryProfile.findUnique({
      where: { nationalId },
    });
    if (existingNatId && existingNatId.userId !== session.userId) {
      return NextResponse.json({ error: 'This National ID has already been registered' }, { status: 400 });
    }

    // Sequence Code Generation (e.g. KH-2026-00011)
    let code = existingProfile?.code;
    if (!code) {
      const count = await prisma.beneficiaryProfile.count();
      code = `KH-2026-${String(count + 1).padStart(5, '0')}`;
    }

    // Perform poverty evaluation score calculation
    const evaluation = calculateScoreAndCategory({
      monthlyIncome: Number(monthlyIncome) || 0,
      familyMembersCount: Number(familyMembersCount) || 1,
      childrenCount: Number(childrenCount) || 0,
      employmentStatus: employmentStatus || 'Unemployed',
      medicalConditions: medicalConditions || '',
      housingStatus: housingStatus || 'Rented',
      debtObligations: Number(debtObligations) || 0,
      urgentNeeds: urgentNeeds || '',
      existingSupport: Number(existingSupport) || 0,
    });

    const profile = await prisma.$transaction(async (tx) => {
      // 1. Create or Update the Profile
      let newProfile;
      const profileData = {
        displayName,
        fullName,
        nationalId,
        category: evaluation.category,
        monthlySupportCap: evaluation.recommendedAmount,
        monthlyReceivedAmount: 0,
        caseSummary,
        areaName,
        latitude: Number(latitude) || 30.0444,
        longitude: Number(longitude) || 31.2357,
        showOnMap: showOnMap !== undefined ? Boolean(showOnMap) : true,
        address,
        phone,
        monthlyIncome: Number(monthlyIncome) || 0,
        familyMembersCount: Number(familyMembersCount) || 1,
        childrenCount: Number(childrenCount) || 0,
        employmentStatus: employmentStatus || 'Unemployed',
        medicalConditions: medicalConditions || '',
        housingStatus: housingStatus || 'Rented',
        debtObligations: Number(debtObligations) || 0,
        urgentNeeds: urgentNeeds || '',
        existingSupport: Number(existingSupport) || 0,
        evaluationScore: evaluation.score,
        status: BeneficiaryStatus.PENDING_REVIEW,
        verificationStatus: 'PENDING',
      };

      if (existingProfile) {
        newProfile = await tx.beneficiaryProfile.update({
          where: { id: existingProfile.id },
          data: profileData,
        });
      } else {
        newProfile = await tx.beneficiaryProfile.create({
          data: {
            userId: session.userId,
            code: code!,
            ...profileData,
          },
        });
      }

      // 2. Log Evaluation History
      await tx.evaluation.create({
        data: {
          beneficiaryProfileId: newProfile.id,
          score: evaluation.score,
          recommendedCategory: evaluation.category,
          recommendedAmount: evaluation.recommendedAmount,
          adminNotes: 'Algorithmic assessment upon profile creation.',
        },
      });

      // 3. Document attachments
      if (mockDocs && Array.isArray(mockDocs)) {
        for (const doc of mockDocs) {
          await tx.beneficiaryDocument.create({
            data: {
              beneficiaryProfileId: newProfile.id,
              documentType: doc.type as DocumentType,
              fileUrl: `/private/documents/${newProfile.id}_${doc.type.toLowerCase()}.jpg`,
              fileName: doc.name || `${doc.type.toLowerCase()}.jpg`,
            },
          });
        }
      }

      // 4. Create System Audit
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'BENEFICIARY_ONBOARDED',
          details: `Profile ${code} onboarded. Score: ${evaluation.score}, Category: ${evaluation.category}, Target: ${evaluation.recommendedAmount} EGP`,
        },
      });

      return newProfile;
    });

    return NextResponse.json({ success: true, code: profile.code });
  } catch (error: any) {
    console.error('Onboarding API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
