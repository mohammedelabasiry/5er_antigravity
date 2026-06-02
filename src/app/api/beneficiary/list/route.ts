import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { BeneficiaryStatus } from '@prisma/client';

function obfuscateCoords(lat: number, lng: number) {
  // Random angle in radians
  const angle = Math.random() * Math.PI * 2;
  // Random distance between 100 and 300 meters
  const distMeters = 100 + Math.random() * 200;
  
  // Degrees offsets
  const latOffset = distMeters / 111000;
  // Cosine of latitude (Egypt is around 30 degrees N, but we compute dynamically)
  const cosLat = Math.cos((lat * Math.PI) / 180) || 1.0;
  const lngOffset = distMeters / (111000 * cosLat);
  
  return {
    latitude: lat + latOffset * Math.sin(angle),
    longitude: lng + lngOffset * Math.cos(angle),
  };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const beneficiaries = await prisma.beneficiaryProfile.findMany({
      where: {
        status: {
          in: [BeneficiaryStatus.APPROVED, BeneficiaryStatus.FULLY_SUPPORTED_THIS_MONTH]
        }
      },
      select: {
        id: true,
        code: true,
        displayName: true,
        category: true,
        monthlySupportCap: true,
        monthlyReceivedAmount: true,
        caseSummary: true,
        areaName: true,
        latitude: true,
        longitude: true,
        familyMembersCount: true,
        childrenCount: true,
        evaluationScore: true,
      },
    });

    // Obfuscate coordinates for security/privacy
    const anonymizedBeneficiaries = beneficiaries.map((b) => {
      const { latitude, longitude } = obfuscateCoords(b.latitude, b.longitude);
      return {
        ...b,
        latitude,
        longitude,
      };
    });

    return NextResponse.json(anonymizedBeneficiaries);
  } catch (error: any) {
    console.error('List beneficiaries API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
