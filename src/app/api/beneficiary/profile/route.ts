import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.BENEFICIARY) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await request.json();
    const { areaName, latitude, longitude, showOnMap } = body;

    // Validate parameters
    if (areaName === undefined || latitude === undefined || longitude === undefined || showOnMap === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiaryProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!beneficiary) {
      return NextResponse.json({ error: 'Beneficiary profile not found' }, { status: 404 });
    }

    const updatedProfile = await prisma.beneficiaryProfile.update({
      where: { id: beneficiary.id },
      data: {
        areaName,
        latitude: Number(latitude),
        longitude: Number(longitude),
        showOnMap: Boolean(showOnMap),
      },
    });

    // Write to Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'BENEFICIARY_LOCATION_UPDATED',
        details: `Updated location to ${areaName} (Lat: ${latitude}, Lng: ${longitude}). Show on map: ${showOnMap}`,
      },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error('Update profile API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
