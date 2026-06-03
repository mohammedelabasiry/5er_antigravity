import { PrismaClient, Role, BeneficiaryStatus, DocumentType, ContributionStatus, ContributionType, DeliveryStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.notification.deleteMany();
  await prisma.adminNote.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.resourceDistribution.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.monthlySupportCycle.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.beneficiaryDocument.deleteMany();
  await prisma.beneficiaryProfile.deleteMany();
  await prisma.donorProfile.deleteMany();
  await prisma.charityProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.resourceStock.deleteMany();

  console.log('Seeding admin...');
  const hashedPassword = bcrypt.hashSync('password123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@khairlink.org',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      name: 'Governance Admin Ahmed',
    },
  });

  console.log('Seeding donors...');
  const donorNames = ['Sadaqah Giver', 'Helpful Hand', 'Generous Heart'];
  const donors = [];
  for (let i = 0; i < 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `donor${i + 1}@gmail.com`,
        passwordHash: hashedPassword,
        role: Role.DONOR,
        name: donorNames[i],
      },
    });
    
    const profile = await prisma.donorProfile.create({
      data: {
        userId: user.id,
        displayName: donorNames[i],
        phone: `+20101234567${i}`,
        bio: `I want to help families in need in my local neighborhood.`,
      },
    });
    donors.push(profile);
  }

  console.log('Seeding charities...');
  const charityNames = ['Resala Association', 'Misr El Kheir', 'Food Bank Egypt'];
  const charities = [];
  for (let i = 0; i < 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `charity${i + 1}@charity.org`,
        passwordHash: hashedPassword,
        role: Role.CHARITY_ADMIN,
        name: `${charityNames[i]} Representative`,
      },
    });

    const profile = await prisma.charityProfile.create({
      data: {
        userId: user.id,
        charityName: charityNames[i],
        licenseNumber: `LIC-99882-${i}`,
        description: `Official charity working to distribute food, medical aid, and financial support.`,
        website: `https://www.${charityNames[i].toLowerCase().replace(/\s+/g, '')}.org`,
        phone: `+2022765432${i}`,
        isApproved: true,
      },
    });
    charities.push(profile);
  }

  console.log('Seeding beneficiaries...');
  // Tahrir Square center coordinates: 30.0444, 31.2357
  const beneficiaryData = [
    {
      email: 'ben1@gmail.com',
      code: 'KH-2026-00001',
      displayName: 'Struggling Family (Renal Patient)',
      fullName: 'Mohamed Ali Mahmoud',
      nationalId: '28503040102345',
      category: 'A',
      monthlySupportCap: 7000,
      caseSummary: 'Family of 5. The breadwinner suffers from chronic kidney failure and cannot work. High medical costs.',
      areaName: 'Downtown Cairo',
      lat: 30.0480,
      lng: 31.2330,
      status: BeneficiaryStatus.APPROVED,
      verificationStatus: 'APPROVED',
      receivedThisMonth: 7000, // Fully Supported Case
      familyMembers: 5,
      children: 3,
      income: 800,
      employment: 'Unemployed',
      medical: 'Severe chronic renal failure requiring dialysis twice a week.',
      housing: 'Rented',
      debt: 12000,
      urgent: 'Needs immediate monthly support for medicine and clean food.',
    },
    {
      email: 'ben2@gmail.com',
      code: 'KH-2026-00002',
      displayName: 'Widowed Mother Case',
      fullName: 'Fatma Hassan Soliman',
      nationalId: '29007120108765',
      category: 'B',
      monthlySupportCap: 5000,
      caseSummary: 'Widow raising four young children on her own. No fixed income except casual sewing work.',
      areaName: 'Garden City',
      lat: 30.0400,
      lng: 31.2400,
      status: BeneficiaryStatus.APPROVED,
      verificationStatus: 'APPROVED',
      receivedThisMonth: 2000, // Partially Supported
      familyMembers: 5,
      children: 4,
      income: 1500,
      employment: 'Part-time (Sewing)',
      medical: 'None',
      housing: 'Rented (Apartment)',
      debt: 3500,
      urgent: 'School fees and monthly rent payment support.',
    },
    {
      email: 'ben3@gmail.com',
      code: 'KH-2026-00003',
      displayName: 'Day Laborer Support',
      fullName: 'Sayed Abdel-Rahman',
      nationalId: '28011200109531',
      category: 'C',
      monthlySupportCap: 3000,
      caseSummary: 'Construction day laborer with irregular work. Family of 6 struggling with rising costs.',
      areaName: 'Zamalek',
      lat: 30.0520,
      lng: 31.2280,
      status: BeneficiaryStatus.APPROVED,
      verificationStatus: 'APPROVED',
      receivedThisMonth: 0, // Unsupported
      familyMembers: 6,
      children: 4,
      income: 2800,
      employment: 'Casual Laborer',
      medical: 'Mild diabetes',
      housing: 'Shared Family House',
      debt: 1500,
      urgent: 'Food package and clothing support.',
    },
    {
      email: 'ben4@gmail.com',
      code: 'KH-2026-00004',
      displayName: 'Elderly Couple Care',
      fullName: 'Ibrahim Khalil Saad',
      nationalId: '25501010103214',
      category: 'D',
      monthlySupportCap: 1500,
      caseSummary: 'An elderly couple with no children or family support. Relying entirely on social charity.',
      areaName: 'Sayeda Zeinab',
      lat: 30.0350,
      lng: 31.2500,
      status: BeneficiaryStatus.FULLY_SUPPORTED_THIS_MONTH, // Mark as fully supported
      verificationStatus: 'APPROVED',
      receivedThisMonth: 1500,
      familyMembers: 2,
      children: 0,
      income: 900,
      employment: 'Retired',
      medical: 'Age-related illnesses, hypertension.',
      housing: 'Owned (Old room)',
      debt: 0,
      urgent: 'Monthly medicine support.',
    },
    {
      email: 'ben5@gmail.com',
      code: 'KH-2026-00005',
      displayName: 'Orphan Siblings Case',
      fullName: 'Amina Youssef Radi',
      nationalId: '20202150106543',
      category: 'A',
      monthlySupportCap: 7000,
      caseSummary: 'Three orphan siblings living together. The oldest sister (19) is trying to support the brothers.',
      areaName: 'Dokki',
      lat: 30.0250,
      lng: 31.2200,
      status: BeneficiaryStatus.PENDING_REVIEW, // Pending review
      verificationStatus: 'PENDING',
      receivedThisMonth: 0,
      familyMembers: 3,
      children: 2,
      income: 0,
      employment: 'Unemployed Student',
      medical: 'None',
      housing: 'Rented',
      debt: 8000,
      urgent: 'Rent arrears and basic food supplies.',
    },
    {
      email: 'ben6@gmail.com',
      code: 'KH-2026-00006',
      displayName: 'Heart Disease Patient Support',
      fullName: 'Ahmed Farouk Metwally',
      nationalId: '27809180104321',
      category: 'B',
      monthlySupportCap: 5000,
      caseSummary: 'Requires open-heart surgery. Unable to work due to severe cardiovascular issues. Urgent.',
      areaName: 'Mohandessin',
      lat: 30.0650,
      lng: 31.2600,
      status: BeneficiaryStatus.APPROVED, // Approved and urgent
      verificationStatus: 'APPROVED',
      receivedThisMonth: 4000,
      familyMembers: 4,
      children: 2,
      income: 1100,
      employment: 'Unemployed',
      medical: 'Cardiovascular disease, awaiting valve replacement surgery.',
      housing: 'Rented (Shared)',
      debt: 20000,
      urgent: 'Surgical supplies and high-dose heart medication.',
    },
    {
      email: 'ben7@gmail.com',
      code: 'KH-2026-00007',
      displayName: 'New Registrant Case',
      fullName: 'Mahmoud Saeed Gomaa',
      nationalId: '29310150109988',
      category: 'C',
      monthlySupportCap: 3000,
      caseSummary: 'Newly registered family. Father lost job recently. Onboarding checklist incomplete.',
      areaName: 'Giza',
      lat: 30.0800,
      lng: 31.2000,
      status: BeneficiaryStatus.DRAFT, // Draft case
      verificationStatus: 'PENDING',
      receivedThisMonth: 0,
      familyMembers: 4,
      children: 2,
      income: 3000,
      employment: 'Unemployed (Recently laid off)',
      medical: 'None',
      housing: 'Rented',
      debt: 4000,
      urgent: 'Temporary support until employment is found.',
    },
    {
      email: 'ben8@gmail.com',
      code: 'KH-2026-00008',
      displayName: 'High Rent Burden Case',
      fullName: 'Zainab Soliman Eid',
      nationalId: '28805050107764',
      category: 'B',
      monthlySupportCap: 5000,
      caseSummary: 'Single mother with 3 school-aged kids. Landlord is threatening eviction due to 3 months unpaid rent.',
      areaName: 'Nasr City',
      lat: 30.0100,
      lng: 31.2900,
      status: BeneficiaryStatus.APPROVED,
      verificationStatus: 'APPROVED',
      receivedThisMonth: 1000,
      familyMembers: 4,
      children: 3,
      income: 1800,
      employment: 'Part-time',
      medical: 'None',
      housing: 'Rented',
      debt: 9000,
      urgent: 'Urgent cash to cover rent arrears and prevent eviction.',
    },
    {
      email: 'ben9@gmail.com',
      code: 'KH-2026-00009',
      displayName: 'Visually Impaired Head of House',
      fullName: 'Mustafa Hassan Qasim',
      nationalId: '26812040101122',
      category: 'A',
      monthlySupportCap: 7000,
      caseSummary: 'Blind father supporting a family of 6. No pension or monthly income. Surviving on neighbors aid.',
      areaName: 'Heliopolis',
      lat: 30.0950,
      lng: 31.3100,
      status: BeneficiaryStatus.APPROVED,
      verificationStatus: 'APPROVED',
      receivedThisMonth: 3000,
      familyMembers: 6,
      children: 4,
      income: 500,
      employment: 'Disabled (Unemployed)',
      medical: 'Complete visual impairment.',
      housing: 'Shared with relatives',
      debt: 5000,
      urgent: 'General food security and school items for children.',
    },
    {
      email: 'ben10@gmail.com',
      code: 'KH-2026-00010',
      displayName: 'Ineligible Applicant Case',
      fullName: 'Ali Omar Refaat',
      nationalId: '28004120106655',
      category: 'D',
      monthlySupportCap: 1500,
      caseSummary: 'High income profile. Owns property and vehicles. Rejected due to false statements on application.',
      areaName: 'Maadi',
      lat: 29.9800,
      lng: 31.2700,
      status: BeneficiaryStatus.REJECTED, // Rejected Case
      verificationStatus: 'REJECTED',
      receivedThisMonth: 0,
      familyMembers: 3,
      children: 1,
      income: 12000,
      employment: 'Full-time Merchant',
      medical: 'None',
      housing: 'Owned',
      debt: 0,
      urgent: 'None',
    },
  ];

  const beneficiaries = [];
  for (const b of beneficiaryData) {
    const user = await prisma.user.create({
      data: {
        email: b.email,
        passwordHash: hashedPassword,
        role: Role.BENEFICIARY,
        name: b.fullName,
      },
    });

    const profile = await prisma.beneficiaryProfile.create({
      data: {
        userId: user.id,
        code: b.code,
        displayName: b.displayName,
        fullName: b.fullName,
        nationalId: b.nationalId,
        category: b.category,
        monthlySupportCap: b.monthlySupportCap,
        monthlyReceivedAmount: b.receivedThisMonth,
        caseSummary: b.caseSummary,
        areaName: b.areaName,
        latitude: b.lat,
        longitude: b.lng,
        address: `${b.areaName}, Street ${Math.floor(Math.random() * 50) + 1}`,
        phone: `+2012876543${Math.floor(Math.random() * 9)}`,
        monthlyIncome: b.income,
        familyMembersCount: b.familyMembers,
        childrenCount: b.children,
        employmentStatus: b.employment,
        medicalConditions: b.medical,
        housingStatus: b.housing,
        debtObligations: b.debt,
        urgentNeeds: b.urgent,
        status: b.status,
        verificationStatus: b.verificationStatus,
        evaluationScore: b.category === 'A' ? 90 : b.category === 'B' ? 75 : b.category === 'C' ? 55 : b.category === 'D' ? 35 : 15,
      },
    });

    // Create a mock document for verification
    await prisma.beneficiaryDocument.create({
      data: {
        beneficiaryProfileId: profile.id,
        documentType: DocumentType.NATIONAL_ID,
        fileUrl: `/private/documents/${profile.id}_national_id.jpg`,
        fileName: 'national_id_front.jpg',
        verified: b.verificationStatus === 'APPROVED',
        verifiedAt: b.verificationStatus === 'APPROVED' ? new Date() : null,
        verifiedById: b.verificationStatus === 'APPROVED' ? adminUser.id : null,
      },
    });

    beneficiaries.push(profile);
  }

  console.log('Generating 100 dynamic diverse beneficiaries...');
  const firstNames = ['Ahmed', 'Fatma', 'Mohamed', 'Zainab', 'Mahmoud', 'Mona', 'Mustafa', 'Amina', 'Ali', 'Noha', 'Hassan', 'Yasmine', 'Tarek', 'Hala', 'Khaled', 'Rania', 'Sherif', 'Mai', 'Amr', 'Farida'];
  const middleNames = ['Abdel-Rahman', 'Ali', 'Hassan', 'Mahmoud', 'Saeed', 'Omar', 'Mustafa', 'Ibrahim', 'El-Sayed', 'Soliman'];
  const lastNames = ['Mansour', 'Salem', 'Hassan', 'El-Masry', 'Gomaa', 'Radwan', 'Khalil', 'Badawy', 'Amer', 'Soliman'];
  
  const AREAS = [
    { name: 'Downtown Cairo', lat: 30.0444, lng: 31.2357 },
    { name: 'Garden City', lat: 30.0360, lng: 31.2320 },
    { name: 'Zamalek', lat: 30.0600, lng: 31.2200 },
    { name: 'Dokki', lat: 30.0380, lng: 31.2110 },
    { name: 'Mohandessin', lat: 30.0620, lng: 31.2030 },
    { name: 'Giza', lat: 30.0130, lng: 31.2080 },
    { name: 'Sayeda Zeinab', lat: 30.0290, lng: 31.2430 },
    { name: 'Nasr City', lat: 30.0560, lng: 31.3300 },
    { name: 'Heliopolis', lat: 30.0980, lng: 31.3200 },
    { name: 'Maadi', lat: 29.9600, lng: 31.2600 },
  ];

  const caseScenarios = [
    {
      summary: 'Widow with school-aged children struggling with rent and expenses.',
      medical: 'Hypertension, requires monthly prescription checks.',
      employment: 'Sewing work from home (unstable)',
      housing: 'Rented',
      needs: 'School fees and monthly clothing.'
    },
    {
      summary: 'Breadwinner injured in construction accident, unable to work.',
      medical: 'Spinal disc injury, regular physical therapy.',
      employment: 'Unemployed (Formerly laborer)',
      housing: 'Shared flat',
      needs: 'Support for therapy sessions and basic food.'
    },
    {
      summary: 'Orphaned family managed by elder sister pursuing studies.',
      medical: 'None',
      employment: 'Student (Part-time cleaner)',
      housing: 'Rented (Small room)',
      needs: 'Rent support and monthly food box.'
    },
    {
      summary: 'Elderly diabetic couple with no family support or pension.',
      medical: 'Type 2 Diabetes, vision difficulties.',
      employment: 'Retired',
      housing: 'Owned (Old building)',
      needs: 'Insulin pens and monthly food supplies.'
    },
    {
      summary: 'Father working as street vendor with 5 family members, income insufficient.',
      medical: 'Child suffers from asthma requiring inhalers.',
      employment: 'Street vendor (Irregular)',
      housing: 'Rented',
      needs: 'Asthma medicine and children clothing.'
    },
    {
      summary: 'Chronic heart patient unable to work, waiting for public hospital support.',
      medical: 'Ischemic heart disease, daily medications.',
      employment: 'Unemployed',
      housing: 'Rented',
      needs: 'Heart medication and basic utility bills support.'
    }
  ];

  for (let i = 11; i <= 110; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const mName = middleNames[Math.floor(Math.random() * middleNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${fName} ${mName} ${lName}`;
    const displayName = `${fName}'s Family Case`;
    const email = `ben${i}@gmail.com`;
    const code = `KH-2026-${String(i).padStart(5, '0')}`;
    const nationalId = `2${Math.floor(Math.random() * 80 + 10)}0${Math.floor(Math.random() * 8 + 1) + 1}0${Math.floor(Math.random() * 20 + 10)}010${Math.floor(Math.random() * 8000 + 1000)}`;
    
    // Choose area randomly
    const area = AREAS[Math.floor(Math.random() * AREAS.length)];
    // Random offset up to 1.5km
    const latOffset = (Math.random() - 0.5) * 0.015;
    const lngOffset = (Math.random() - 0.5) * 0.015;
    const lat = area.lat + latOffset;
    const lng = area.lng + lngOffset;

    // Distribute category
    const categories = ['A', 'B', 'C', 'D'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    let monthlySupportCap = 1500;
    let evalScore = 35;
    if (category === 'A') { monthlySupportCap = 7000; evalScore = 90; }
    else if (category === 'B') { monthlySupportCap = 5000; evalScore = 75; }
    else if (category === 'C') { monthlySupportCap = 3000; evalScore = 55; }

    // Choose status
    const statusRand = Math.random();
    let status: BeneficiaryStatus = BeneficiaryStatus.APPROVED;
    let verificationStatus = 'APPROVED';
    if (statusRand < 0.15) {
      status = BeneficiaryStatus.PENDING_REVIEW;
      verificationStatus = 'PENDING';
    } else if (statusRand < 0.2) {
      status = BeneficiaryStatus.DRAFT;
      verificationStatus = 'PENDING';
    } else if (statusRand < 0.25) {
      status = BeneficiaryStatus.REJECTED;
      verificationStatus = 'REJECTED';
    }

    // Set showOnMap: 85% of cases are shown on map
    const showOnMap = Math.random() < 0.85;

    // Family details
    const scenario = caseScenarios[Math.floor(Math.random() * caseScenarios.length)];
    const familyMembers = Math.floor(Math.random() * 6) + 2;
    const children = Math.max(0, familyMembers - 2);
    const income = Math.floor(Math.random() * 2000) + 500;
    const debt = Math.random() > 0.5 ? Math.floor(Math.random() * 10000) + 1000 : 0;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: Role.BENEFICIARY,
        name: fullName,
      },
    });

    const profile = await prisma.beneficiaryProfile.create({
      data: {
        userId: user.id,
        code,
        displayName,
        fullName,
        nationalId,
        category,
        monthlySupportCap,
        monthlyReceivedAmount: 0, // initially 0
        caseSummary: scenario.summary,
        areaName: area.name,
        latitude: lat,
        longitude: lng,
        address: `${area.name}, Street ${Math.floor(Math.random() * 80) + 1}`,
        phone: `+2010${Math.floor(Math.random() * 90000000 + 10000000)}`,
        monthlyIncome: income,
        familyMembersCount: familyMembers,
        childrenCount: children,
        employmentStatus: scenario.employment,
        medicalConditions: scenario.medical,
        housingStatus: scenario.housing,
        debtObligations: debt,
        urgentNeeds: scenario.needs,
        status,
        verificationStatus,
        evaluationScore: evalScore,
        showOnMap,
      },
    });

    // Create verification document
    await prisma.beneficiaryDocument.create({
      data: {
        beneficiaryProfileId: profile.id,
        documentType: DocumentType.NATIONAL_ID,
        fileUrl: `/private/documents/${profile.id}_national_id.jpg`,
        fileName: 'national_id_front.jpg',
        verified: verificationStatus === 'APPROVED',
        verifiedAt: verificationStatus === 'APPROVED' ? new Date() : null,
        verifiedById: verificationStatus === 'APPROVED' ? adminUser.id : null,
      },
    });
    
    beneficiaries.push(profile);
  }

  console.log('Seeding contributions...');
  // Case 1: Fully Supported (Cap: 7000)
  // Donor 1 contributes 3000 EGP, Charity 1 contributes 4000 EGP
  const b1 = beneficiaries[0];
  const don1 = donors[0];
  const ch1 = charities[0];

  const c1 = await prisma.contribution.create({
    data: {
      beneficiaryProfileId: b1.id,
      donorProfileId: don1.id,
      amount: 3000,
      type: ContributionType.CASH,
      status: ContributionStatus.CONFIRMED,
      notes: 'Monthly cash support contribution.',
    },
  });

  const c2 = await prisma.contribution.create({
    data: {
      beneficiaryProfileId: b1.id,
      charityProfileId: ch1.id,
      amount: 4000,
      type: ContributionType.CASH,
      status: ContributionStatus.CONFIRMED,
      notes: 'Charity joint support program.',
    },
  });

  // Case 2: Partially Supported (Cap: 5000, Received: 2000)
  // Donor 2 contributes 2000 EGP
  const b2 = beneficiaries[1];
  const don2 = donors[1];
  await prisma.contribution.create({
    data: {
      beneficiaryProfileId: b2.id,
      donorProfileId: don2.id,
      amount: 2000,
      type: ContributionType.CASH,
      status: ContributionStatus.CONFIRMED,
      notes: 'Support for widowed mother.',
    },
  });

  // Case 4: Fully Supported via Resource Distribution (Cap: 1500, Received: 1500)
  // Charity 2 contributes resource (Estimated value: 1500 EGP)
  const b4 = beneficiaries[3];
  const ch2 = charities[1];
  const c4 = await prisma.contribution.create({
    data: {
      beneficiaryProfileId: b4.id,
      charityProfileId: ch2.id,
      amount: 1500,
      type: ContributionType.RESOURCE,
      status: ContributionStatus.DELIVERED,
      resourceType: 'Elderly Health & Food Package',
      resourceQuantity: 1,
      notes: 'Delivered medical supplies and a family food box.',
    },
  });

  await prisma.resourceDistribution.create({
    data: {
      contributionId: c4.id,
      beneficiaryProfileId: b4.id,
      charityProfileId: ch2.id,
      resourceType: 'Elderly Health & Food Package',
      quantity: 1,
      estimatedValue: 1500,
      deliveryStatus: DeliveryStatus.DELIVERED,
      notes: 'Handed over directly to the couple.',
      proofOfDeliveryUrl: '/uploads/proofs/delivery_b4.jpg',
    },
  });

  // Case 6: Partially Supported Urgent (Cap: 5000, Received: 4000)
  // Charity 3 contributes 4000 EGP
  const b6 = beneficiaries[5];
  const ch3 = charities[2];
  await prisma.contribution.create({
    data: {
      beneficiaryProfileId: b6.id,
      charityProfileId: ch3.id,
      amount: 4000,
      type: ContributionType.CASH,
      status: ContributionStatus.CONFIRMED,
      notes: 'Urgent cardiac support fund.',
    },
  });

  // Case 8: Partially Supported Rent Burden (Cap: 5000, Received: 1000)
  // Donor 3 contributes 1000 EGP
  const b8 = beneficiaries[7];
  const don3 = donors[2];
  await prisma.contribution.create({
    data: {
      beneficiaryProfileId: b8.id,
      donorProfileId: don3.id,
      amount: 1000,
      type: ContributionType.CASH,
      status: ContributionStatus.CONFIRMED,
      notes: 'Rent rescue contribution.',
    },
  });

  // Case 9: Partially Supported Blind Father (Cap: 7000, Received: 3000)
  // Charity 1 contributes 3000 EGP
  const b9 = beneficiaries[8];
  await prisma.contribution.create({
    data: {
      beneficiaryProfileId: b9.id,
      charityProfileId: ch1.id,
      amount: 3000,
      type: ContributionType.CASH,
      status: ContributionStatus.CONFIRMED,
      notes: 'Special disability allowance.',
    },
  });

  console.log('Seeding chat conversations and messages...');
  // Chat between Donor 1 and Beneficiary 2 (anonymous)
  const conv1 = await prisma.chatConversation.create({
    data: {
      beneficiaryProfileId: b2.id,
      donorProfileId: don1.id,
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        conversationId: conv1.id,
        senderId: don1.userId,
        senderName: don1.displayName,
        content: 'Assalamu Alaikum, I would like to support your family with the sewing machine materials. Will a cash transfer of 2,000 EGP help today?',
      },
      {
        conversationId: conv1.id,
        senderId: b2.userId,
        senderName: b2.displayName,
        content: 'Wa Alaikum Assalam. Yes, indeed, this would help buy the fabric roll and sewing threads. Jazakum Allahu Khairan.',
      },
      {
        conversationId: conv1.id,
        senderId: don1.userId,
        senderName: don1.displayName,
        content: 'I have initiated the transfer of 2,000 EGP. You should receive it shortly on the platform.',
        isRead: true,
      },
    ],
  });

  // Chat between Charity 1 and Beneficiary 1
  const conv2 = await prisma.chatConversation.create({
    data: {
      beneficiaryProfileId: b1.id,
      charityProfileId: ch1.id,
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        conversationId: conv2.id,
        senderId: ch1.userId,
        senderName: ch1.charityName,
        content: 'Hello, we are review your case for monthly dialysis support. A representative will visit your area to verify the medical reports.',
      },
      {
        conversationId: conv2.id,
        senderId: b1.userId,
        senderName: b1.displayName,
        content: 'Thank you. I have all medical files ready at home. You can contact me anytime.',
      },
    ],
  });

  console.log('Seeding audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'BENEFICIARY_APPROVED',
        details: `Approved case KH-2026-00001 after validating medical records. Set monthly cap to 7000 EGP.`,
        ipAddress: '192.168.1.1',
      },
      {
        userId: adminUser.id,
        action: 'BENEFICIARY_APPROVED',
        details: `Approved case KH-2026-00002. Category B (5000 EGP).`,
        ipAddress: '192.168.1.1',
      },
      {
        userId: adminUser.id,
        action: 'BENEFICIARY_REJECTED',
        details: `Rejected case KH-2026-00010 due to failure to meet need criteria (high income profile).`,
        ipAddress: '192.168.1.1',
      },
      {
        userId: ch1.userId,
        action: 'DONATION_CREATED',
        details: `Charity ${ch1.charityName} contributed 4000 EGP cash donation to KH-2026-00001.`,
        ipAddress: '192.168.1.5',
      },
      {
        userId: adminUser.id,
        action: 'ADMIN_OVERRIDE_APPLIED',
        details: `Admin unlocked monthly eligibility for case KH-2026-00004 manually.`,
        ipAddress: '192.168.1.1',
      },
    ],
  });

  console.log('Seeding notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        title: 'New Beneficiary Review Required',
        message: 'A new beneficiary (KH-2026-00005) has completed onboarding and requires document verification.',
        type: 'ADMIN_REVIEW_REQUIRED',
      },
      {
        userId: b1.userId,
        title: 'Monthly Cap Completed!',
        message: 'Alhamdulillah! Your required monthly support of 7,000 EGP has been fully covered for this month.',
        type: 'SUPPORT_CAP',
      },
      {
        userId: b2.userId,
        title: 'Contribution Received',
        message: 'You have received 2,000 EGP from a generous donor.',
        type: 'CONTRIBUTION_RECEIVED',
      },
    ],
  });

  console.log('Seeding stock...');
  await prisma.resourceStock.createMany({
    data: [
      { resourceType: 'Meat Distribution', quantity: 150, unit: 'kg' },
      { resourceType: 'Food Box', quantity: 60, unit: 'units' },
      { resourceType: 'Clothes', quantity: 45, unit: 'bags' },
      { resourceType: 'Medicine', quantity: 30, unit: 'units' },
      { resourceType: 'School Supplies', quantity: 25, unit: 'boxes' },
    ],
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
