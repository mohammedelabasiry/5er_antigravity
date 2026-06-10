import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncBeneficiaryCapStatus } from '@/lib/capLogic';
import { povertyModel } from '@/lib/mlEvaluation';
import { BeneficiaryStatus } from '@prisma/client';

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const beneficiaryId = params.id;
    const body = await request.json();
    const { status, category, monthlySupportCap, isEligibleOverride, noteText } = body;

    const profile = await prisma.beneficiaryProfile.findUnique({
      where: { id: beneficiaryId },
      include: { user: true },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Beneficiary profile not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const dataToUpdate: any = {};
      
      if (status) {
        dataToUpdate.status = status as BeneficiaryStatus;
        if (status === BeneficiaryStatus.APPROVED) {
          dataToUpdate.verificationStatus = 'APPROVED';
        } else if (status === BeneficiaryStatus.REJECTED) {
          dataToUpdate.verificationStatus = 'REJECTED';
        }
      }

      if (category) {
        dataToUpdate.category = category;
      }
      
      if (typeof monthlySupportCap === 'number') {
        dataToUpdate.monthlySupportCap = monthlySupportCap;
      }
      
      if (typeof isEligibleOverride === 'boolean') {
        dataToUpdate.isEligibleOverride = isEligibleOverride;
      }

      const p = await tx.beneficiaryProfile.update({
        where: { id: beneficiaryId },
        data: dataToUpdate,
      });

      // Add audit admin note
      if (noteText && noteText.trim()) {
        await tx.adminNote.create({
          data: {
            beneficiaryProfileId: beneficiaryId,
            adminId: session.userId,
            content: noteText.trim(),
          },
        });
      }

      // Generate notifications for beneficiary
      let title = 'Profile Status Updated';
      let message = `Your account status has been changed to ${status || p.status}.`;
      
      if (status === BeneficiaryStatus.APPROVED) {
        title = 'Account Approved!';
        message = `Alhamdulillah! Your account verification was successful. Your monthly required support cap is set to ${p.monthlySupportCap} EGP.`;
      } else if (status === BeneficiaryStatus.REJECTED) {
        title = 'Account Verification Unsuccessful';
        message = 'Your submitted documents could not be verified. Please contact administrative support.';
      }

      await tx.notification.create({
        data: {
          userId: profile.userId,
          title,
          message,
          type: 'DOCUMENT_VERIFIED',
        },
      });

      // Add audit log entry
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'ADMIN_BENEFICIARY_UPDATE',
          details: `Admin ${session.name} updated beneficiary code ${profile.code}. Changes: ${JSON.stringify(dataToUpdate)}. Note: ${noteText || 'N/A'}`,
        },
      });

      // Teach the AI model from this admin decision (online learning)
      const targetCategory = category || p.category;
      const targetAmount = typeof monthlySupportCap === 'number' ? monthlySupportCap : p.monthlySupportCap;
      try {
        povertyModel.trainStep(
          {
            monthlyIncome: profile.monthlyIncome,
            familyMembersCount: profile.familyMembersCount,
            childrenCount: profile.childrenCount,
            employmentStatus: profile.employmentStatus,
            medicalConditions: profile.medicalConditions,
            housingStatus: profile.housingStatus,
            debtObligations: profile.debtObligations,
            urgentNeeds: profile.urgentNeeds,
            existingSupport: profile.existingSupport,
          },
          targetCategory as 'A' | 'B' | 'C' | 'D',
          targetAmount
        );
      } catch (err) {
        console.error('AI model training step failed:', err);
      }

      return p;
    });

    // Re-verify and sync the cap status dynamically in case cap limits or overrides changed
    await syncBeneficiaryCapStatus(beneficiaryId);

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error('Admin beneficiary update error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
