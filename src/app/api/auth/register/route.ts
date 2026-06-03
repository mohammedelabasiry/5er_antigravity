import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      role,
      charityName,
      licenseNumber,
      charityPhone,
      charityDescription,
      phone,
      nationalId,
      address,
      areaName,
    } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required registration details' }, { status: 400 });
    }

    // Prevent public registration of admin roles
    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden role selection' }, { status: 403 });
    }

    // Validation for Donor/Beneficiary details
    if (role === Role.DONOR || role === Role.BENEFICIARY) {
      if (!phone || !nationalId) {
        return NextResponse.json({ error: 'Phone number and National ID are required.' }, { status: 400 });
      }
      if (nationalId.length !== 14 || !/^\d+$/.test(nationalId)) {
        return NextResponse.json({ error: 'National ID must be exactly 14 digits.' }, { status: 400 });
      }
    }

    // Validation for Beneficiary address/area
    if (role === Role.BENEFICIARY) {
      if (!address || !areaName) {
        return NextResponse.json({ error: 'Address and Area Name are required for beneficiaries.' }, { status: 400 });
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email address is already in use' }, { status: 400 });
    }

    // National ID uniqueness check
    if (nationalId) {
      const existingBeneficiaryNatId = await prisma.beneficiaryProfile.findUnique({
        where: { nationalId },
      });
      if (existingBeneficiaryNatId) {
        return NextResponse.json({ error: 'This National ID is already registered.' }, { status: 400 });
      }

      const existingDonorNatId = await prisma.donorProfile.findFirst({
        where: { nationalId },
      });
      if (existingDonorNatId) {
        return NextResponse.json({ error: 'This National ID is already registered.' }, { status: 400 });
      }
    }

    const passwordHash = await hashPassword(password);

    // Create user and profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: role as Role,
          name,
        },
      });

      if (role === Role.DONOR) {
        await tx.donorProfile.create({
          data: {
            userId: user.id,
            displayName: name,
            bio: 'Supporting local families.',
            phone,
            nationalId,
            fullName: name,
          },
        });
      } else if (role === Role.BENEFICIARY) {
        // Generate sequence code
        const count = await tx.beneficiaryProfile.count();
        const code = `KH-2026-${String(count + 1).padStart(5, '0')}`;

        // Create a DRAFT profile to be completed during onboarding
        await tx.beneficiaryProfile.create({
          data: {
            userId: user.id,
            code,
            displayName: `Safe Profile ${code}`,
            fullName: name,
            nationalId,
            phone,
            address,
            areaName,
            category: 'D',
            monthlySupportCap: 0.0,
            monthlyReceivedAmount: 0.0,
            caseSummary: 'Pending onboarding details.',
            latitude: 30.0444, // Default Cairo coords, updated during onboarding
            longitude: 31.2357,
            status: 'DRAFT',
            verificationStatus: 'PENDING',
            employmentStatus: 'Unemployed',
            housingStatus: 'Rented',
          },
        });
      } else if (role === Role.CHARITY_ADMIN) {
        if (!charityName || !licenseNumber || !charityPhone) {
          throw new Error('Charity name, license number, and phone number are required.');
        }

        const existingLic = await tx.charityProfile.findUnique({
          where: { licenseNumber },
        });
        if (existingLic) {
          throw new Error('A charity license with this number has already registered.');
        }

        await tx.charityProfile.create({
          data: {
            userId: user.id,
            charityName,
            licenseNumber,
            description: charityDescription || 'Charity organization registered on KhairLink.',
            phone: charityPhone,
            isApproved: false, // Requires Admin verification
          },
        });
      }

      return user;
    });

    // Auto-login setting session cookies
    await setSessionCookie({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'USER_REGISTER',
        details: `Registered account: ${newUser.email} (${newUser.role})`,
      },
    });

    let redirectUrl = '/';
    if (newUser.role === Role.DONOR) {
      redirectUrl = '/donor/dashboard';
    } else if (newUser.role === Role.CHARITY_ADMIN) {
      redirectUrl = '/charity/dashboard';
    } else if (newUser.role === Role.BENEFICIARY) {
      redirectUrl = '/beneficiary/onboarding';
    }

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, name: newUser.name, role: newUser.role },
      redirectUrl,
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
