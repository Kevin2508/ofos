import { prisma } from '../../config/prisma.ts';
import { CreateAddressDto } from './customer.dto.ts';

async function findAddressesByID(userId:number){

    return await prisma.customerAddress.findMany({
    where: {
     customerUserId : userId
    },
  });
     
}

async function createAddress(customerId:number, payload: CreateAddressDto){

      return prisma.customerAddress.create({
        data:{
          customerUserId: customerId,
          label: payload.label,

          contactName: payload.contactName,
          contactPhone: payload.contactPhone,

          addressLine1: payload.addressLine1,
          addressLine2: payload.addressLine2,

          landmark: payload.landmark,

           city: payload.city,
           state: payload.state,
           postalCode: payload.postalCode,
           country: payload.country,
     
           latitude: payload.latitude,
           longitude: payload.longitude,

           isDefault: payload.isDefault ?? false,
        },
      });
}


async function findAddressesByCustomerID(id:number){

  return await prisma.customerAddress.findMany({

    where:{
      customerUserId: BigInt(id),
    },

  });

}

async function findAddressesById(addressId:number){

  console.log('Repository Start', addressId);

    const result = await prisma.customerAddress.findUnique({
        where: {
            id: BigInt(addressId)
        },
    });

    console.log('Repository End', result);

    return result;
}

async function updateCustomerAddress(adressId: number, payload:CreateAddressDto){

  return await prisma.customerAddress.update({
    where: {
      id: BigInt(adressId),
    },
    data: {
            label: payload.label,
            contactName: payload.contactName,
            contactPhone: payload.contactPhone,
            addressLine1: payload.addressLine1,
            addressLine2: payload.addressLine2,
            landmark: payload.landmark,
            city: payload.city,
            state: payload.state,
            postalCode: payload.postalCode,
            country: payload.country,
            latitude: payload.latitude,
            longitude: payload.longitude,
            isDefault: payload.isDefault,
    },
  });
}

async function findAddressById1(addressId: number) {
  return await prisma.customerAddress.findUnique({
    where: {
      id: BigInt(addressId),
    },
  });
}

async function deleteAddressById(addressId: number) {
  return await prisma.customerAddress.delete({
    where: {
      id: BigInt(addressId),
    },
  });
}
export {
    findAddressesByID,
    createAddress,
    findAddressesByCustomerID,
    findAddressesById, updateCustomerAddress,
    findAddressById1, deleteAddressById
}