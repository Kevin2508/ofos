import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, FoodType, UserStatus, UserRoleStatus, RestaurantStatus } from '../src/generated/prisma/client.ts';
import bcrypt from 'bcryptjs';

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seeding database with local image assets...');

  // 1. Seed Roles
  console.log('Seeding Roles...');
  const rolesData = [
    { name: 'Customer', description: 'Regular customer who orders food' },
    { name: 'Admin', description: 'Administrator with full system privileges' },
    { name: 'Fleet_manager', description: 'Manager for delivery fleet' },
    { name: 'Delivery_partner', description: 'Partner delivering food' },
    { name: 'Restaurant_owner', description: 'Owner of one or more restaurants' },
    { name: 'Restaurant_staff', description: 'Staff working at a restaurant branch' },
  ];

  const roles: Record<string, any> = {};
  for (const role of rolesData) {
    roles[role.name] = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // 2. Seed Users
  console.log('Seeding Users...');
  const saltRounds = 10;
  const defaultPasswordHash = bcrypt.hashSync('password123', saltRounds);

  const usersData = [
    {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@epicure.com',
      phone: '9999999999',
      passwordHash: defaultPasswordHash,
      status: UserStatus.ACTIVE,
    },
    {
      firstName: 'Restaurant',
      lastName: 'Owner',
      email: 'owner@epicure.com',
      phone: '8888888888',
      passwordHash: defaultPasswordHash,
      status: UserStatus.ACTIVE,
    },
    {
      firstName: 'John',
      lastName: 'Customer',
      email: 'customer@epicure.com',
      phone: '7777777777',
      passwordHash: defaultPasswordHash,
      status: UserStatus.ACTIVE,
    },
  ];

  const seededUsers: Record<string, any> = {};
  for (const userData of usersData) {
    seededUsers[userData.email] = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
  }

  // 3. Map User Roles
  console.log('Mapping User Roles...');
  const userRolesData = [
    {
      userId: seededUsers['admin@epicure.com'].id,
      roleId: roles['Admin'].id,
      status: UserRoleStatus.ASSIGNED,
    },
    {
      userId: seededUsers['owner@epicure.com'].id,
      roleId: roles['Restaurant_owner'].id,
      status: UserRoleStatus.ASSIGNED,
    },
    {
      userId: seededUsers['customer@epicure.com'].id,
      roleId: roles['Customer'].id,
      status: UserRoleStatus.ASSIGNED,
    },
  ];

  for (const userRole of userRolesData) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: userRole.userId,
          roleId: userRole.roleId,
        },
      },
      update: { status: userRole.status },
      create: userRole,
    });
  }

  // 4. Seed Restaurants
  console.log('Seeding Restaurants...');
  const restaurantsData = [
    {
      ownerUserId: seededUsers['owner@epicure.com'].id,
      businessName: 'Spice Hub',
      legalBusinessName: 'Spice Hub Foods Pvt. Ltd.',
      primaryPhone: '9876543210',
      primaryEmail: 'info@spicehub.com',
      logoUrl: '/images/restaurant_logo.png',
      coverImageUrl: '/images/restaurant_cover.png',
      description: 'North Indian & Chinese Delicacies',
      status: RestaurantStatus.APPROVED,
    },
    {
      ownerUserId: seededUsers['owner@epicure.com'].id,
      businessName: 'Pizza Palace',
      legalBusinessName: 'Pizza Palace Franchise',
      primaryPhone: '9876543211',
      primaryEmail: 'info@pizzapalace.com',
      logoUrl: '/images/restaurant_logo.png',
      coverImageUrl: '/images/restaurant_cover.png',
      description: 'Cheesy Gourmet Pizzas and Italian Sides',
      status: RestaurantStatus.APPROVED,
    },
    {
      ownerUserId: seededUsers['owner@epicure.com'].id,
      businessName: 'Burger Bistro',
      legalBusinessName: 'Burger Bistro Inc.',
      primaryPhone: '9876543212',
      primaryEmail: 'info@burgerbistro.com',
      logoUrl: '/images/restaurant_logo.png',
      coverImageUrl: '/images/restaurant_cover.png',
      description: 'Juicy burgers, crispy sides and milkshakes',
      status: RestaurantStatus.APPROVED,
    },
  ];

  const seededRestaurants: Record<string, any> = {};
  for (const restData of restaurantsData) {
    const existing = await prisma.restaurant.findFirst({
      where: { businessName: restData.businessName },
    });
    if (existing) {
      seededRestaurants[restData.businessName] = await prisma.restaurant.update({
        where: { id: existing.id },
        data: {
          logoUrl: restData.logoUrl,
          coverImageUrl: restData.coverImageUrl,
          description: restData.description,
          status: restData.status,
        },
      });
    } else {
      seededRestaurants[restData.businessName] = await prisma.restaurant.create({
        data: restData,
      });
    }
  }

  // 5. Seed Branches
  console.log('Seeding Restaurant Branches...');
  const branchesData = [
    {
      restaurantId: seededRestaurants['Spice Hub'].id,
      branchName: 'Spice Hub - Rajkot Main',
      gstin: '24AAAAA1111A1Z1',
      fssaiLicenseNumber: '12345678901234',
      contactPhone: '9876543210',
      addressLine1: 'Kalavad Road, Opp. Kotecha Nagar',
      city: 'Rajkot',
      state: 'Gujarat',
      postalCode: '360005',
      country: 'India',
      latitude: '22.30390000',
      longitude: '70.80220000',
      minimumOrderValue: 200.0,
      deliveryFee: 40.0,
      isActive: true,
    },
    {
      restaurantId: seededRestaurants['Pizza Palace'].id,
      branchName: 'Pizza Palace - Ahmedabad West',
      gstin: '24BBBBB2222B2Z2',
      fssaiLicenseNumber: '12345678901235',
      contactPhone: '9876543211',
      addressLine1: 'SG Highway, Bodakdev',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380054',
      country: 'India',
      latitude: '23.02250000',
      longitude: '72.57140000',
      minimumOrderValue: 150.0,
      deliveryFee: 50.0,
      isActive: true,
    },
    {
      restaurantId: seededRestaurants['Burger Bistro'].id,
      branchName: 'Burger Bistro - Mumbai Bandra',
      gstin: '27CCCCC3333C3Z3',
      fssaiLicenseNumber: '12345678901236',
      contactPhone: '9876543212',
      addressLine1: 'Linking Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
      country: 'India',
      latitude: '19.07600000',
      longitude: '72.87770000',
      minimumOrderValue: 100.0,
      deliveryFee: 60.0,
      isActive: true,
    },
  ];

  const seededBranches: Record<string, any> = {};
  for (const branch of branchesData) {
    const existing = await prisma.restaurantBranch.findFirst({
      where: { branchName: branch.branchName },
    });
    if (existing) {
      seededBranches[branch.branchName] = await prisma.restaurantBranch.update({
        where: { id: existing.id },
        data: branch,
      });
    } else {
      seededBranches[branch.branchName] = await prisma.restaurantBranch.create({
        data: branch,
      });
    }
  }

  // 6. Seed Menu Categories
  console.log('Seeding Menu Categories...');
  const categoriesData = [
    // Spice Hub Categories
    {
      branchId: seededBranches['Spice Hub - Rajkot Main'].id,
      name: 'Starters',
      description: 'Appetizers to get your meal started',
      displayOrder: 1,
      isActive: true,
    },
    {
      branchId: seededBranches['Spice Hub - Rajkot Main'].id,
      name: 'Main Course',
      description: 'Satisfying mains for a hearty meal',
      displayOrder: 2,
      isActive: true,
    },
    {
      branchId: seededBranches['Spice Hub - Rajkot Main'].id,
      name: 'Desserts',
      description: 'Sweet endings',
      displayOrder: 3,
      isActive: true,
    },
    // Pizza Palace Categories
    {
      branchId: seededBranches['Pizza Palace - Ahmedabad West'].id,
      name: 'Classic Pizzas',
      description: 'Our standard beloved recipes',
      displayOrder: 1,
      isActive: true,
    },
    {
      branchId: seededBranches['Pizza Palace - Ahmedabad West'].id,
      name: 'Sides',
      description: 'Complement your pizza',
      displayOrder: 2,
      isActive: true,
    },
    // Burger Bistro Categories
    {
      branchId: seededBranches['Burger Bistro - Mumbai Bandra'].id,
      name: 'Gourmet Burgers',
      description: 'Flame grilled delicious burgers',
      displayOrder: 1,
      isActive: true,
    },
    {
      branchId: seededBranches['Burger Bistro - Mumbai Bandra'].id,
      name: 'Drinks',
      description: 'Refreshments and beverages',
      displayOrder: 2,
      isActive: true,
    },
  ];

  const seededCategories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const existing = await prisma.menuCategory.findFirst({
      where: {
        branchId: cat.branchId,
        name: cat.name,
      },
    });
    if (existing) {
      seededCategories[`${cat.branchId}-${cat.name}`] = await prisma.menuCategory.update({
        where: { id: existing.id },
        data: cat,
      });
    } else {
      seededCategories[`${cat.branchId}-${cat.name}`] = await prisma.menuCategory.create({
        data: cat,
      });
    }
  }

  // 7. Seed Menu Items
  console.log('Seeding Menu Items...');
  const itemsData = [
    // Spice Hub -> Starters
    {
      categoryId: seededCategories[`${seededBranches['Spice Hub - Rajkot Main'].id}-Starters`].id,
      sku: 'SH-START-SPRING',
      name: 'Crispy Vegetable Spring Rolls',
      description: 'Crunchy deep-fried rolls filled with shredded seasonal vegetables and spices',
      basePrice: 120.0,
      foodType: FoodType.VEG,
      isBestseller: true,
      imageUrl: '/images/veg_food.png',
    },
    {
      categoryId: seededCategories[`${seededBranches['Spice Hub - Rajkot Main'].id}-Starters`].id,
      sku: 'SH-START-PANTEEKA',
      name: 'Amritsari Paneer Tikka',
      description: 'Soft cottage cheese cubes marinated in yogurt and hot Indian spices, roasted in charcoal clay oven',
      basePrice: 240.0,
      foodType: FoodType.VEG,
      isBestseller: false,
      imageUrl: '/images/veg_food.png',
    },
    // Spice Hub -> Main Course
    {
      categoryId: seededCategories[`${seededBranches['Spice Hub - Rajkot Main'].id}-Main Course`].id,
      sku: 'SH-MAIN-PBMASALA',
      name: 'Paneer Butter Masala',
      description: 'Fresh paneer chunks cooked in an ultra-rich, creamy, tomato, onion and cashew gravy',
      basePrice: 220.0,
      foodType: FoodType.VEG,
      isBestseller: true,
      imageUrl: '/images/veg_food.png',
    },
    {
      categoryId: seededCategories[`${seededBranches['Spice Hub - Rajkot Main'].id}-Main Course`].id,
      sku: 'SH-MAIN-BUNAAN',
      name: 'Butter Naan',
      description: 'Leavened flatbread cooked in clay oven and glazed generously with butter',
      basePrice: 40.0,
      foodType: FoodType.VEG,
      isBestseller: false,
      imageUrl: '/images/veg_food.png',
    },
    // Spice Hub -> Desserts
    {
      categoryId: seededCategories[`${seededBranches['Spice Hub - Rajkot Main'].id}-Desserts`].id,
      sku: 'SH-DESS-GJAMUN',
      name: 'Warm Gulab Jamun (2 Pcs)',
      description: 'Deep-fried golden brown balls of milk solids soaked in cardamom-flavored sugar syrup',
      basePrice: 80.0,
      foodType: FoodType.VEG,
      isBestseller: false,
      imageUrl: '/images/veg_food.png',
    },
    // Pizza Palace -> Classic Pizzas
    {
      categoryId: seededCategories[`${seededBranches['Pizza Palace - Ahmedabad West'].id}-Classic Pizzas`].id,
      sku: 'PP-PIZ-MARG',
      name: 'Double Cheese Margherita',
      description: 'Classic combination of house-made san marzano tomato sauce, double mozzarella and fresh basil leaves',
      basePrice: 199.0,
      foodType: FoodType.VEG,
      isBestseller: true,
      imageUrl: '/images/veg_food.png',
    },
    {
      categoryId: seededCategories[`${seededBranches['Pizza Palace - Ahmedabad West'].id}-Classic Pizzas`].id,
      sku: 'PP-PIZ-PEP',
      name: 'Spicy Pepperoni Pizza',
      description: 'Gourmet pork pepperoni slice combined with crushed green chillies and shredded mozzarella cheese',
      basePrice: 299.0,
      foodType: FoodType.NON_VEG,
      isBestseller: true,
      imageUrl: '/images/non_veg_food.png',
    },
    // Pizza Palace -> Sides
    {
      categoryId: seededCategories[`${seededBranches['Pizza Palace - Ahmedabad West'].id}-Sides`].id,
      sku: 'PP-SIDE-GARLIC',
      name: 'Garlic Breadsticks',
      description: 'Baked breadsticks infused with garlic butter, served with cheesy dip',
      basePrice: 99.0,
      foodType: FoodType.VEG,
      isBestseller: false,
      imageUrl: '/images/veg_food.png',
    },
    // Burger Bistro -> Gourmet Burgers
    {
      categoryId: seededCategories[`${seededBranches['Burger Bistro - Mumbai Bandra'].id}-Gourmet Burgers`].id,
      sku: 'BB-BURG-CHEESE',
      name: 'Signature Cheese Burger',
      description: 'Crispy vegetable patty layered with liquid cheddar cheese, pickle slices, lettuce and thousand island dressing',
      basePrice: 149.0,
      foodType: FoodType.VEG,
      isBestseller: true,
      imageUrl: '/images/veg_food.png',
    },
    {
      categoryId: seededCategories[`${seededBranches['Burger Bistro - Mumbai Bandra'].id}-Gourmet Burgers`].id,
      sku: 'BB-BURG-CHICK',
      name: 'Crispy Fried Chicken Burger',
      description: 'Crispy golden fried chicken breast fillet topped with mayonnaise, melting cheese slice and icebergs lettuce',
      basePrice: 189.0,
      foodType: FoodType.NON_VEG,
      isBestseller: true,
      imageUrl: '/images/non_veg_food.png',
    },
    // Burger Bistro -> Drinks
    {
      categoryId: seededCategories[`${seededBranches['Burger Bistro - Mumbai Bandra'].id}-Drinks`].id,
      sku: 'BB-DRNK-COLA',
      name: 'Thums Up (Can 330ml)',
      description: 'Chilled Indian cola with strong fizz and spice notes',
      basePrice: 40.0,
      foodType: FoodType.VEG,
      isBestseller: false,
      imageUrl: '/images/veg_food.png',
    },
  ];

  for (const item of itemsData) {
    await prisma.menuItem.upsert({
      where: { sku: item.sku },
      update: {
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        basePrice: item.basePrice,
        foodType: item.foodType,
        isBestseller: item.isBestseller,
        imageUrl: item.imageUrl,
      },
      create: item,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
