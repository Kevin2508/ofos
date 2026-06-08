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

<<<<<<< HEAD
  console.log('Repository Start');
=======
  console.log('Repository Start', addressId);
>>>>>>> 6cc4dc7 (customer address module is done)

    const result = await prisma.customerAddress.findUnique({
        where: {
            id: BigInt(addressId)
        },
    });

<<<<<<< HEAD
    console.log('Repository End');
=======
    console.log('Repository End', result);
>>>>>>> 6cc4dc7 (customer address module is done)

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
<<<<<<< HEAD

async function removeDefaultAddresses(customerUserId:number) {
  
        return await prisma.customerAddress.updateMany({
          where: {
            customerUserId: BigInt(customerUserId),
          },
          data: {
            isDefault: false,
          },
        });
}

async function setAddressAsDefault(addressId: number) {
     return await prisma.customerAddress.update({
       where: {
         id: BigInt(addressId),
       },
       data: {
         isDefault: true,
       },
     });
}
=======
>>>>>>> 6cc4dc7 (customer address module is done)
export {
    findAddressesByID,
    createAddress,
    findAddressesByCustomerID,
    findAddressesById, updateCustomerAddress,
<<<<<<< HEAD
    findAddressById1, deleteAddressById, removeDefaultAddresses,
    setAddressAsDefault
=======
    findAddressById1, deleteAddressById
>>>>>>> 6cc4dc7 (customer address module is done)
}