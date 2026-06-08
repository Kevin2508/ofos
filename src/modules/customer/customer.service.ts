import { prisma } from '../../config/prisma.ts';
import { CreateAddressDto, customerDto } from './customer.dto.ts';
import { createAddress, findAddressesByCustomerID, findAddressesByID, findAddressesById,
    updateCustomerAddress, findAddressById1, deleteAddressById
} from './customer.repository.ts';


async function getAddressesService(customer:customerDto){

    const existingAddresses = await findAddressesByID(Number(customer.id));

    if(!existingAddresses || existingAddresses.length === 0){
                
        return{
            success: false,
            message: 'No addresses found',
            data: [],
        };
    }

    return{
        success: true,
        message: 'Addresses fetched successfully.',
        data: existingAddresses,
    };

}

async function addAddressService(customer:customerDto, payload:CreateAddressDto){

    const address = await createAddress(Number(customer.id), payload);

    const result = JSON.parse(
     JSON.stringify(address, (_, value) =>
       typeof value === 'bigint'
         ? value.toString()
         : value
     )
   );
    return{
        message: 'Address Created Successfully...',
        data: result,
    };
}

async function getAddressesByIdService(customerId:number){

    const address = await findAddressesByCustomerID(customerId);

           if (!address) {
           return {
             message: 'Address not found',
             data: null,
           };
         }
       
         return {
           message: 'Address fetched successfully',
           data: address,
         };
}

async function updateAdressService(addressID:number, payload: CreateAddressDto){

    console.log("Hello There===========================================");
    const address = await findAddressesById(addressID);

    console.log('Address Found:', address);
    if(!address){
        return{
            message: 'Address not found',
            data: null,
        };
    }

    const updateAddress = await updateCustomerAddress(addressID, payload);

    return{
        message: 'Address updated successfully.',
        data: updateAddress,
    }
}

async function deleteAddressService(addressId: number) {

  const existingAddress =
    await findAddressById1(addressId);

  if (!existingAddress) {
    return {
      message: 'Address not found',
      data: null,
    };
  }

  const deletedAddress =
    await deleteAddressById(addressId);

  return {
    message: 'Address deleted successfully',
    data: deletedAddress,
  };
}
export { getAddressesService, addAddressService, getAddressesByIdService, updateAdressService, deleteAddressService}