import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  props: { params: Promise<{ code: string }> }
) {
  try {
    const params = await props.params;
    const profile = await prisma.beneficiaryProfile.findUnique({
      where: { code: params.code },
      select: {
        id: true,
        code: true,
        displayName: true,
        category: true,
        monthlySupportCap: true,
        monthlyReceivedAmount: true,
        caseSummary: true,
        areaName: true,
        status: true,
        evaluationScore: true,
        familyMembersCount: true,
        childrenCount: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (profile.status !== 'APPROVED' && profile.status !== 'FULLY_SUPPORTED_THIS_MONTH') {
      return NextResponse.json({ error: 'Not available' }, { status: 403 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
