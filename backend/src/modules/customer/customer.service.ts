import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAddressDto } from './dto/customer-address.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async getAddresses(userId: bigint) {
    return this.prisma.customerAddress.findMany({
      where: { customerUserId: userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: bigint, dto: CreateAddressDto) {
    const existingCount = await this.prisma.customerAddress.count({
      where: { customerUserId: userId },
    });

    const isDefault = dto.isDefault ?? existingCount === 0;

    if (isDefault && existingCount > 0) {
      await this.prisma.customerAddress.updateMany({
        where: { customerUserId: userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.customerAddress.create({
      data: {
        customerUserId: userId,
        label: dto.label,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2 || null,
        landmark: dto.landmark || null,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country || 'India',
        latitude: dto.latitude,
        longitude: dto.longitude,
        isDefault,
      },
    });
  }

  async setDefaultAddress(userId: bigint, addressId: bigint) {
    const address = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerUserId: userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.customerAddress.updateMany({
      where: { customerUserId: userId },
      data: { isDefault: false },
    });

    return this.prisma.customerAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }

  async deleteAddress(userId: bigint, addressId: bigint) {
    const address = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerUserId: userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.customerAddress.delete({
      where: { id: addressId },
    });

    if (address.isDefault) {
      const nextAddress = await this.prisma.customerAddress.findFirst({
        where: { customerUserId: userId },
        orderBy: { createdAt: 'desc' },
      });
      if (nextAddress) {
        await this.prisma.customerAddress.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Address deleted successfully' };
  }
}
