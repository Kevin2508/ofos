import { catchAsync } from "../../middlewares/catch.async.ts";
import { Request, Response } from "express-serve-static-core";
import { initiatePaymentSchema, verifyPaymentSchema } from "./payment.validation.ts";
import { getPaymentDetailsService, inititatePaymentService,
         verifyPaymentService
 } from "./payment.service.ts";

const inititatePayment = catchAsync(
    async(req:Request, res:Response) =>{


         const { error } = initiatePaymentSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

         if (error) {
                return res.status(400).json({
                  status: 'fail',
                  errors: error.details.map(
                    detail => detail.message
                  ),
                });
         }

         const result = await inititatePaymentService(req.body);
         console.log(result);

         const serializedResult =
            JSON.parse(
                JSON.stringify(
                    result,
                    (_, value) =>
                        typeof value === 'bigint'
                            ? value.toString()
                            : value
                )
            );

            return res.status(200).json({
                status: 'success',
                message: serializedResult.message,
                data: serializedResult.data
            })
    }
)

const verifyPayment = catchAsync(
    async(req:Request, res:Response) =>{

        const {error} = verifyPaymentSchema.validate(req.body,{
            abortEarly: false,
            stripUnknown: true
        })

         if (error) {
                return res.status(400).json({
                  status: 'fail',
                  errors: error.details.map(
                    detail => detail.message
                  ),
                });
         }

         const result = await verifyPaymentService(req.body);

         const serializedResult = JSON.parse(
            JSON.stringify(result, (_, value) =>
            typeof value == 'bigint' ? value.toString() : value)
         );

         return res.status(200).json({
            status: 'success',
            message: serializedResult.message,
            data: serializedResult.data
         })
    }
)

const getPaymentDetails = catchAsync(
    async(req:Request, res:Response) =>{

         const orderId = Number(req.params.orderId);

         if (isNaN(orderId)) {
           return res.status(400).json({
             status: 'fail',
             message: 'Invalid Order id',
           });
         }

         const result = await getPaymentDetailsService(orderId);

         const serializedResult = JSON.parse(
            JSON.stringify(result, (_, value) => 
            typeof value == 'bigint' ? value.toString : value)
         )

          return res.status(200).json({
            status: 'success',
            message: serializedResult.message,
            data: serializedResult.data
         })

    }
)
export {inititatePayment, verifyPayment, getPaymentDetails}