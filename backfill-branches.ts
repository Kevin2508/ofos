import { prisma } from './src/config/prisma.ts';

async function backfill() {
  const restaurants = await prisma.restaurant.findMany({
    where: { deletedAt: null },
  });

  for (const r of restaurants) {
    const existing = await prisma.restaurantBranch.findFirst({
      where: { restaurantId: r.id, deletedAt: null },
    });

    if (!existing) {
      const branch = await prisma.restaurantBranch.create({
        data: {
          restaurantId: r.id,
          branchName: `${r.businessName} — Main Branch`,
          gstin: 'PENDING',
          fssaiLicenseNumber: 'PENDING',
          contactPhone: r.primaryPhone,
          addressLine1: 'Address to be updated',
          city: 'City',
          state: 'State',
          postalCode: '000000',
          country: 'India',
          latitude: 0,
          longitude: 0,
          minimumOrderValue: 0,
          deliveryFee: 0,
        },
      });
      console.log(`✅ Created branch for restaurant "${r.businessName}" (ID: ${r.id}) → Branch ID: ${branch.id}`);
    } else {
      console.log(`⏭  Restaurant "${r.businessName}" (ID: ${r.id}) already has branch ID: ${existing.id}`);
    }
  }

  await prisma.$disconnect();
}

backfill();
