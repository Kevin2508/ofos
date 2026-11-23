import path from 'node:path';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  RestaurantStatus,
  FoodType,
  UserRoleStatus,
  UserStatus,
  AddressLabel,
  VehicleType,
  DeliveryPartnerStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_DATABASE_URL;
if (!connectionString) {
  throw new Error('POSTGRES_DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding OFOS platform baseline & sample data...');

  // 1. Roles
  const rolesData = [
    { name: 'Customer', description: 'Customer ordering food' },
    { name: 'Restaurant_owner', description: 'Owner of restaurant businesses' },
    { name: 'Restaurant_staff', description: 'Branch kitchen and counter staff' },
    { name: 'Delivery_partner', description: 'Fleet delivery rider' },
    { name: 'Fleet_manager', description: 'Fleet dispatcher and manager' },
    { name: 'Finance_manager', description: 'Financial payouts and accounting' },
    { name: 'Admin', description: 'System administrator with full access' },
  ];

  for (const role of rolesData) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  console.log('✔ Roles seeded.');

  // 2. Demo Users
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@ofos.com' },
    update: {},
    create: {
      firstName: 'Marco',
      lastName: 'Rossi',
      email: 'owner@ofos.com',
      phone: '+919876543201',
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  const ownerRole = await prisma.role.findUnique({ where: { name: 'Restaurant_owner' } });
  if (ownerRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: owner.id, roleId: ownerRole.id } },
      update: {},
      create: { userId: owner.id, roleId: ownerRole.id, status: UserRoleStatus.ASSIGNED },
    });
  }

  const financeUser = await prisma.user.upsert({
    where: { email: 'finance@ofos.com' },
    update: {},
    create: {
      firstName: 'Fiona',
      lastName: 'Finance',
      email: 'finance@ofos.com',
      phone: '+919876543010',
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  const financeRole = await prisma.role.findUnique({ where: { name: 'Finance_manager' } });
  if (financeRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: financeUser.id, roleId: financeRole.id } },
      update: {},
      create: { userId: financeUser.id, roleId: financeRole.id, status: UserRoleStatus.ASSIGNED },
    });
  }

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ofos.com' },
    update: {},
    create: {
      firstName: 'Ada',
      lastName: 'Admin',
      email: 'admin@ofos.com',
      phone: '+919876543000',
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id, status: UserRoleStatus.ASSIGNED },
    });
  }

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@ofos.com' },
    update: {},
    create: {
      firstName: 'Chloe',
      lastName: 'Customer',
      email: 'customer@ofos.com',
      phone: '+919876543020',
      passwordHash,
      status: UserStatus.ACTIVE,
      customerProfile: {
        create: {
          referralCode: 'OFOSFOOD',
          loyaltyPointsBalance: 250,
        },
      },
    },
  });

  const customerRole = await prisma.role.findUnique({ where: { name: 'Customer' } });
  if (customerRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: customerUser.id, roleId: customerRole.id } },
      update: {},
      create: { userId: customerUser.id, roleId: customerRole.id, status: UserRoleStatus.ASSIGNED },
    });
  }

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver_phase7@ofos.com' },
    update: {},
    create: {
      firstName: 'Ravi',
      lastName: 'Rider',
      email: 'driver_phase7@ofos.com',
      phone: '+919876543030',
      passwordHash,
      status: UserStatus.ACTIVE,
      deliveryPartner: {
        create: {
          vehicleType: VehicleType.MOTORCYCLE,
          vehicleRegistrationNumber: 'KA-01-AB-1234',
          isOnline: true,
          status: DeliveryPartnerStatus.APPROVED,
        },
      },
    },
  });

  const driverRole = await prisma.role.findUnique({ where: { name: 'Delivery_partner' } });
  if (driverRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: driverUser.id, roleId: driverRole.id } },
      update: {},
      create: { userId: driverUser.id, roleId: driverRole.id, status: UserRoleStatus.ASSIGNED },
    });
  }

  const fleetUser = await prisma.user.upsert({
    where: { email: 'fleet@ofos.com' },
    update: {},
    create: {
      firstName: 'Felix',
      lastName: 'Fleet',
      email: 'fleet@ofos.com',
      phone: '+919876543040',
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  const fleetRole = await prisma.role.findUnique({ where: { name: 'Fleet_manager' } });
  if (fleetRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: fleetUser.id, roleId: fleetRole.id } },
      update: {},
      create: { userId: fleetUser.id, roleId: fleetRole.id, status: UserRoleStatus.ASSIGNED },
    });
  }

  // 3. Restaurants
  const restaurantsData = [
    {
      businessName: 'Pizza Bella',
      legalBusinessName: 'Pizza Bella Gourmet Foods Ltd',
      primaryPhone: '+919876543201',
      primaryEmail: 'info@pizzabella.ofos.com',
      logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=1200',
      description: 'Artisanal wood-fired sourdough pizzas & Italian pasta',
      cuisineTags: 'Italian, Pizza, Pasta, Fast Food',
      status: RestaurantStatus.APPROVED,
    },
    {
      businessName: 'Spice Symphony',
      legalBusinessName: 'Spice Symphony Hospitality Pvt Ltd',
      primaryPhone: '+919876543202',
      primaryEmail: 'taste@spicesymphony.ofos.com',
      logoUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
      description: 'Rich North Indian curries, aromatic biryanis & tandoori platters',
      cuisineTags: 'North Indian, Biryani, Mughlai, Tandoor',
      status: RestaurantStatus.APPROVED,
    },
    {
      businessName: 'Burger Craft',
      legalBusinessName: 'Burger Craft Kitchens LLP',
      primaryPhone: '+919876543203',
      primaryEmail: 'hello@burgercraft.ofos.com',
      logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      coverImageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200',
      description: 'Smash burgers, loaded truffle fries & hand-spun thickshakes',
      cuisineTags: 'Burgers, American, Fast Food, Shakes',
      status: RestaurantStatus.APPROVED,
    },
  ];

  for (const rData of restaurantsData) {
    let restaurant = await prisma.restaurant.findFirst({
      where: { businessName: rData.businessName },
    });
    if (!restaurant) {
      restaurant = await prisma.restaurant.create({
        data: {
          ownerUserId: owner.id,
          ...rData,
        },
      });
    }

    // Branch
    let branch = await prisma.restaurantBranch.findFirst({
      where: { restaurantId: restaurant.id },
    });
    if (!branch) {
      branch = await prisma.restaurantBranch.create({
        data: {
          restaurantId: restaurant.id,
          branchName: `${rData.businessName} - Downtown Central`,
          gstin: '24AAAAA0000A1Z5',
          fssaiLicenseNumber: '11521000000001',
          contactPhone: rData.primaryPhone,
          addressLine1: '42 MG Road, Connaught Place',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
          latitude: 19.076,
          longitude: 72.8777,
          minimumOrderValue: 150.0,
          deliveryFee: 35.0,
          isActive: true,
          isAcceptingOrders: true,
        },
      });

      // Operating Hours (All days)
      for (let day = 0; day <= 6; day++) {
        await prisma.restaurantOperatingHour.upsert({
          where: { branchId_dayOfWeek: { branchId: branch.id, dayOfWeek: day } },
          update: {},
          create: {
            branchId: branch.id,
            dayOfWeek: day,
            isClosed: false,
          },
        });
      }

      // Delivery Zone
      await prisma.restaurantDeliveryZone.upsert({
        where: { branchId: branch.id },
        update: {},
        create: {
          branchId: branch.id,
          radiusKm: 10.0,
          minimumDeliveryTimeMinutes: 25,
          maximumDeliveryTimeMinutes: 45,
        },
      });
    }

    // Categories and Items
    const existingCat = await prisma.menuCategory.findFirst({ where: { branchId: branch.id } });
    if (!existingCat) {
      if (rData.businessName === 'Pizza Bella') {
      const catPizza = await prisma.menuCategory.create({
        data: {
          branchId: branch.id,
          name: 'Signature Pizzas',
          description: '11-inch hand-stretched Neapolitan sourdough crust',
          displayOrder: 1,
        },
      });

      const itemMargherita = await prisma.menuItem.create({
        data: {
          categoryId: catPizza.id,
          sku: 'PIZ-MARG-01',
          name: 'Margherita D.O.P.',
          description: 'San Marzano tomatoes, fresh buffalo mozzarella, sweet basil & extra virgin olive oil',
          imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600',
          basePrice: 349.0,
          foodType: FoodType.VEG,
          isBestseller: true,
          isAvailable: true,
        },
      });

      const itemTruffle = await prisma.menuItem.create({
        data: {
          categoryId: catPizza.id,
          sku: 'PIZ-TRUF-02',
          name: 'Wild Mushroom & Black Truffle',
          description: 'Roasted portobello, fior di latte, black truffle oil & shaved parmesan',
          imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600',
          basePrice: 479.0,
          foodType: FoodType.VEG,
          isBestseller: true,
          isAvailable: true,
        },
      });

      const catPasta = await prisma.menuCategory.create({
        data: {
          branchId: branch.id,
          name: 'Fresh Pastas',
          description: 'Daily handcrafted pasta with authentic sauces',
          displayOrder: 2,
        },
      });

      await prisma.menuItem.create({
        data: {
          categoryId: catPasta.id,
          sku: 'PAS-PESTO-01',
          name: 'Penne Genovese Pesto',
          description: 'Fresh basil pine-nut pesto, sun-dried cherry tomatoes, toasted walnuts',
          imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281781?w=600',
          basePrice: 389.0,
          foodType: FoodType.VEG,
          isBestseller: false,
          isAvailable: true,
        },
      });

      // Modifiers: Crust & Add-ons
      const modCrust = await prisma.modifierGroup.create({
        data: {
          branchId: branch.id,
          name: 'Choice of Crust',
          isRequired: true,
          minSelection: 1,
          maxSelection: 1,
        },
      });

      await prisma.modifierOption.createMany({
        data: [
          { modifierGroupId: modCrust.id, optionName: 'Thin Crust (Classic)', additionalPrice: 0.0, displayOrder: 1 },
          { modifierGroupId: modCrust.id, optionName: 'Cheese Burst', additionalPrice: 85.0, displayOrder: 2 },
          { modifierGroupId: modCrust.id, optionName: 'Gluten-Free Cauliflower Crust', additionalPrice: 60.0, displayOrder: 3 },
        ],
      });

      const modExtra = await prisma.modifierGroup.create({
        data: {
          branchId: branch.id,
          name: 'Extra Toppings',
          isRequired: false,
          minSelection: 0,
          maxSelection: 3,
        },
      });

      await prisma.modifierOption.createMany({
        data: [
          { modifierGroupId: modExtra.id, optionName: 'Extra Buffalo Mozzarella', additionalPrice: 50.0, displayOrder: 1 },
          { modifierGroupId: modExtra.id, optionName: 'Jalapeno Peppers', additionalPrice: 30.0, displayOrder: 2 },
          { modifierGroupId: modExtra.id, optionName: 'Kalamata Olives', additionalPrice: 40.0, displayOrder: 3 },
        ],
      });

      // Link modifier groups to Margherita
      await prisma.menuItemModifierGroup.createMany({
        data: [
          { menuItemId: itemMargherita.id, modifierGroupId: modCrust.id },
          { menuItemId: itemMargherita.id, modifierGroupId: modExtra.id },
          { menuItemId: itemTruffle.id, modifierGroupId: modCrust.id },
        ],
        skipDuplicates: true,
      });
    } else if (rData.businessName === 'Spice Symphony') {
      const catCurry = await prisma.menuCategory.create({
        data: {
          branchId: branch.id,
          name: 'Royal Curries & Tandoor',
          description: 'Slow-cooked in copper degs and clay tandoor',
          displayOrder: 1,
        },
      });

      await prisma.menuItem.create({
        data: {
          categoryId: catCurry.id,
          sku: 'IND-PANR-01',
          name: 'Paneer Butter Masala',
          description: 'Cottage cheese cubes tossed in rich tomato-cashew satin gravy with churned butter',
          imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600',
          basePrice: 329.0,
          foodType: FoodType.VEG,
          isBestseller: true,
          isAvailable: true,
        },
      });

      await prisma.menuItem.create({
        data: {
          categoryId: catCurry.id,
          sku: 'IND-BIR-01',
          name: 'Dum Pukht Biryani',
          description: 'Long grain basmati rice, saffron, caramelised onions and fragrant spices',
          imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600',
          basePrice: 369.0,
          foodType: FoodType.VEG,
          isBestseller: true,
          isAvailable: true,
        },
      });
    } else if (rData.businessName === 'Burger Craft') {
      const catBurgers = await prisma.menuCategory.create({
        data: {
          branchId: branch.id,
          name: 'Smash & Crispy Burgers',
          description: 'Served in toasted brioche buns with secret craft sauce',
          displayOrder: 1,
        },
      });

      await prisma.menuItem.create({
        data: {
          categoryId: catBurgers.id,
          sku: 'BGR-SMASH-01',
          name: 'Classic Cheeseburger Supreme',
          description: 'Double grilled patty, cheddar melt, gherkins, caramelized onions & burger relish',
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
          basePrice: 289.0,
          foodType: FoodType.NON_VEG,
          isBestseller: true,
          isAvailable: true,
        },
      });

      await prisma.menuItem.create({
        data: {
          categoryId: catBurgers.id,
          sku: 'BGR-VEG-02',
          name: 'Crispy Veg Truffle Burger',
          description: 'Golden spiced potato & pea patty, truffle mayo, butterhead lettuce',
          imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600',
          basePrice: 239.0,
          foodType: FoodType.VEG,
          isBestseller: true,
          isAvailable: true,
        },
      });
    }
    }
  }

  console.log('✔ Sample restaurants, branches, categories, items, and modifiers seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
