import { catchAsync } from "../../middlewares/catch.async.ts";
import { Request, Response } from "express-serve-static-core";
import { addAddressService, getAddressesByIdService, getAddressesService,
    updateAdressService, deleteAddressService
 } from "./customer.service.ts";
import { customerDto, CreateAddressDto } from "./customer.dto.ts";
import { createAddressSchema } from "./customer.valication.ts";
import { json } from "node:stream/consumers";



const getAddresses = catchAsync(
  async (req: Request, res: Response) => {
    
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }
     console.log(req.user);

     const result = await getAddressesService(req.user as customerDto);
   
    return res.status(201).json({
      status: result.success? 'success': 'fail',
      message: result.message,
      data: result.data
    });
  }
);

const insertAddresses = catchAsync(
    async(req:Request, res:Response) =>{
          
        console.log(req.body);

        const {error, value} = createAddressSchema.validate(req.body,{
            abortEarly: false,
            stripUnknown: true
        });

        if(error){
                return res.status(400).json({
                status: 'fail in validation',
                errors: error.details.map(
                  detail => detail.message
                ),
              });
        }

        const result = await addAddressService(req.user as customerDto, value);

         return res.status(201).json({
         status: result.message? 'success': 'fail',
         message: result.message,
         data: result.data
       });
    }
)

const getAddressesById = catchAsync(
    async(req:Request, res:Response) =>{

        console.log("Customer Id = ", req.params.id);
        const customerId = Number(req.params.id);

        if(isNaN(customerId)){
             return res.status(400).json({
             status: 'fail',
             message: 'Invalid customer id',
            });
        }

        const result = await getAddressesByIdService(customerId);

         const serializedData = JSON.parse(
          JSON.stringify(result, (_, value) =>
            typeof value === 'bigint'
              ? value.toString()
              : value
          )
        );

        if(serializedData.data.length === 0){
            return res.status(200).json({
                message: 'Not contains any address for now.',
                data: serializedData.data,
            });
        }

         return res.status(serializedData.data ? 200 : 404).json({
         status: serializedData.data ? 'success' : 'fail',
         message: serializedData.message,
         data: serializedData.data,
       });

    }
)

const updateCustomerAddress = catchAsync(
    async(req:Request, res:Response)=>{

         const addressId = Number(req.params.id);

         if(isNaN(addressId)){
            return res.status(400).json({
                status: 'Fail',
                message: 'Invalid Address Id.'
            })
         }

         const { error, value } =
         createAddressSchema.validate(req.body, {
           abortEarly: false,
           stripUnknown: true,
         });

         if(error){
            return res.status(400).json({
                status: 'Fail',
                errors: error.details.map(
                    detail => detail.message
                ),
            });
         }

         const result = await updateAdressService(
            addressId,
            value
         );

         const serializeVal = JSON.parse(
          JSON.stringify(result, (_, value) =>
            typeof value === 'bigint'
              ? value.toString()
              : value
          )
        );

         if(serializeVal.data === null){

            return res.status(404).json({
            status: 'fail',
            message: serializeVal.message,
            data: serializeVal.data,
            });
         }

         return res.status(serializeVal.data ? 200: 404).json({
            status: serializeVal.data ? 'success' : 'fail',
            message: serializeVal.message,
            data: serializeVal.data,
         });

       }
)

const deleteCustomerAddress = catchAsync(

    async(req:Request, res:Response) =>{
            const addressId = Number(req.params.id);

    if (isNaN(addressId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid address id',
      });
    }

    const result =
      await deleteAddressService(addressId);

    const serializedResult = JSON.parse(
      JSON.stringify(
        result,
        (_, value) =>
          typeof value === 'bigint'
            ? value.toString()
            : value
      )
    );

    if (!serializedResult.data) {
      return res.status(404).json({
        status: 'fail',
        message: serializedResult.message,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: serializedResult.message,
      data: serializedResult.data,
    });
            
    }
)
export {getAddresses, insertAddresses, getAddressesById, updateCustomerAddress, deleteCustomerAddress}