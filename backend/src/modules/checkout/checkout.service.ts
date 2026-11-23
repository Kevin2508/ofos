import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartStatus, DeliveryType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EstimateDeliveryDto, InitiateCheckoutDto } from './dto/checkout.dto';

function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateEstimateMinutes(distanceKm: number): number {
  if (distanceKm <= 0) return 30;
  const speedKmPerHour = 30; // 30 km/h average city transit speed
  const travelMinutes = (distanceKm / speedKmPerHour) * 60;
  const prepBuffer = 5; // 5 min kitchen prep
  return Math.ceil(travelMinutes + prepBuffer);
}

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async initiateCheckout(userId: bigint, dto: InitiateCheckoutDto) {
    const cart = await this.prisma.cart.findFirst({
      where: {
        customerUserId: userId,
        status: CartStatus.ACTIVE,
      },
      include: {
        branch: {
          include: {
            restaurant: true,
          },
        },
        items: {
          include: {
            menuItem: {
              include: {
                images: true,
              },
            },
            modifiers: {
              include: {
                modifierOption: true,
              },
            },
          },
        },
        priceBreakdowns: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cannot initiate checkout with an empty cart');
    }

    const minimumOrderValue = Number(cart.branch.minimumOrderValue || 0);
    const subtotal = cart.priceBreakdowns[0]
      ? Number(cart.priceBreakdowns[0].subtotal)
      : Number(cart.subtotalAmount);

    if (minimumOrderValue > 0 && subtotal < minimumOrderValue) {
      throw new BadRequestException(
        `Minimum order value of ₹${minimumOrderValue} is not met. Current subtotal: ₹${subtotal}`,
      );
    }

    const addressId = BigInt(dto.addressId);
    const address = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerUserId: userId },
    });

    if (!address) {
      throw new NotFoundException('Selected delivery address not found');
    }

    const branchLat = Number(cart.branch.latitude);
    const branchLng = Number(cart.branch.longitude);
    const addrLat = Number(address.latitude);
    const addrLng = Number(address.longitude);

    const isTakeaway = dto.deliveryType.toUpperCase() === 'TAKEAWAY';
    let estimatedMinutes = isTakeaway ? 15 : 30;
    if (!isTakeaway && branchLat && branchLng && addrLat && addrLng) {
      const dist = calculateHaversineDistance(
        branchLat,
        branchLng,
        addrLat,
        addrLng,
      );
      estimatedMinutes = calculateEstimateMinutes(dist);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const deliveryTypeEnum =
      dto.deliveryType.toUpperCase() === 'SCHEDULED'
        ? DeliveryType.SCHEDULED
        : DeliveryType.ASAP;

    const session = await this.prisma.checkoutSession.create({
      data: {
        cartId: cart.id,
        customerUserId: userId,
        addressId: address.id,
        deliveryType: deliveryTypeEnum,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        paymentMethodId: dto.paymentMethodId ? BigInt(dto.paymentMethodId) : null,
        couponId: dto.couponId ? BigInt(dto.couponId) : null,
        estimatedDeliveryMinutes: estimatedMinutes,
        expiresAt,
      },
      include: {
        cart: {
          include: {
            branch: {
              include: {
                restaurant: true,
              },
            },
            items: {
              include: {
                menuItem: {
                  include: {
                    images: true,
                  },
                },
                modifiers: {
                  include: {
                    modifierOption: true,
                  },
                },
              },
            },
            priceBreakdowns: {
              orderBy: { calculatedAt: 'desc' },
              take: 1,
            },
          },
        },
        address: true,
      },
    });

    return {
      id: session.id.toString(),
      cartId: session.cartId.toString(),
      customerUserId: session.customerUserId.toString(),
      addressId: session.addressId.toString(),
      deliveryType: session.deliveryType,
      scheduledFor: session.scheduledFor,
      estimatedDeliveryMinutes: session.estimatedDeliveryMinutes,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      cart: {
        branch: {
          id: session.cart.branch.id.toString(),
          branchName: session.cart.branch.branchName,
          restaurant: {
            id: session.cart.branch.restaurant.id.toString(),
            businessName: session.cart.branch.restaurant.businessName,
          },
        },
        items: session.cart.items.map((item) => ({
          id: item.id.toString(),
          name: item.menuItem?.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice).toFixed(2),
          lineTotal: Number(item.lineTotal).toFixed(2),
          specialInstructions: item.specialInstructions,
        })),
        priceBreakdown: session.cart.priceBreakdowns[0]
          ? {
              subtotal: Number(session.cart.priceBreakdowns[0].subtotal).toFixed(2),
              discountAmount: Number(
                session.cart.priceBreakdowns[0].discountAmount,
              ).toFixed(2),
              deliveryFee: Number(
                session.cart.priceBreakdowns[0].deliveryFee,
              ).toFixed(2),
              taxAmount: Number(
                session.cart.priceBreakdowns[0].taxAmount,
              ).toFixed(2),
              totalAmount: Number(
                session.cart.priceBreakdowns[0].totalAmount,
              ).toFixed(2),
            }
          : null,
      },
      address: {
        id: session.address.id.toString(),
        label: session.address.label,
        contactName: session.address.contactName,
        contactPhone: session.address.contactPhone,
        addressLine1: session.address.addressLine1,
        addressLine2: session.address.addressLine2,
        city: session.address.city,
        state: session.address.state,
        postalCode: session.address.postalCode,
      },
    };
  }

  async getCheckoutSession(userId: bigint, sessionId: bigint) {
    const session = await this.prisma.checkoutSession.findFirst({
      where: {
        id: sessionId,
        customerUserId: userId,
      },
      include: {
        cart: {
          include: {
            branch: {
              include: {
                restaurant: true,
              },
            },
            items: {
              include: {
                menuItem: {
                  include: {
                    images: true,
                  },
                },
                modifiers: {
                  include: {
                    modifierOption: true,
                  },
                },
              },
            },
            priceBreakdowns: {
              orderBy: { calculatedAt: 'desc' },
              take: 1,
            },
          },
        },
        address: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    if (new Date() > session.expiresAt) {
      throw new BadRequestException('Checkout session has expired');
    }

    if (session.expiresAt < new Date()) {
      throw new BadRequestException(
        'Checkout session has expired. Please initiate checkout again.',
      );
    }

    return {
      id: session.id.toString(),
      cartId: session.cartId.toString(),
      customerUserId: session.customerUserId.toString(),
      addressId: session.addressId.toString(),
      deliveryType: session.deliveryType,
      scheduledFor: session.scheduledFor,
      estimatedDeliveryMinutes: session.estimatedDeliveryMinutes,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      cart: {
        branch: {
          id: session.cart.branch.id.toString(),
          branchName: session.cart.branch.branchName,
          restaurant: {
            id: session.cart.branch.restaurant.id.toString(),
            businessName: session.cart.branch.restaurant.businessName,
          },
        },
        items: session.cart.items.map((item) => ({
          id: item.id.toString(),
          name: item.menuItem?.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice).toFixed(2),
          lineTotal: Number(item.lineTotal).toFixed(2),
          specialInstructions: item.specialInstructions,
        })),
        priceBreakdown: session.cart.priceBreakdowns[0]
          ? {
              subtotal: Number(session.cart.priceBreakdowns[0].subtotal).toFixed(2),
              discountAmount: Number(
                session.cart.priceBreakdowns[0].discountAmount,
              ).toFixed(2),
              deliveryFee: Number(
                session.cart.priceBreakdowns[0].deliveryFee,
              ).toFixed(2),
              taxAmount: Number(
                session.cart.priceBreakdowns[0].taxAmount,
              ).toFixed(2),
              totalAmount: Number(
                session.cart.priceBreakdowns[0].totalAmount,
              ).toFixed(2),
            }
          : null,
      },
      address: {
        id: session.address.id.toString(),
        label: session.address.label,
        contactName: session.address.contactName,
        contactPhone: session.address.contactPhone,
        addressLine1: session.address.addressLine1,
        addressLine2: session.address.addressLine2,
        city: session.address.city,
        state: session.address.state,
        postalCode: session.address.postalCode,
      },
    };
  }

  async estimateDelivery(
    userId: bigint,
    sessionId: bigint,
    dto: EstimateDeliveryDto,
  ) {
    const session = await this.prisma.checkoutSession.findFirst({
      where: { id: sessionId, customerUserId: userId },
      include: {
        cart: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    if (new Date() > session.expiresAt) {
      throw new BadRequestException('Checkout session has expired');
    }

    const addressId = BigInt(dto.addressId);
    const address = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerUserId: userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const branchLat = Number(session.cart.branch.latitude);
    const branchLng = Number(session.cart.branch.longitude);
    const addrLat = Number(address.latitude);
    const addrLng = Number(address.longitude);

    let distanceKm = 0;
    let estimatedMinutes = 30;

    if (branchLat && branchLng && addrLat && addrLng) {
      distanceKm = calculateHaversineDistance(
        branchLat,
        branchLng,
        addrLat,
        addrLng,
      );
      estimatedMinutes = calculateEstimateMinutes(distanceKm);
    }

    await this.prisma.checkoutSession.update({
      where: { id: sessionId },
      data: {
        addressId,
        estimatedDeliveryMinutes: estimatedMinutes,
      },
    });

    return {
      estimatedDeliveryMinutes: estimatedMinutes,
      distanceKm: distanceKm.toFixed(2),
      durationText: `${estimatedMinutes} mins`,
    };
  }
}
