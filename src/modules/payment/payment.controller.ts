import { catchAsync } from "../../middlewares/catch.async.ts";
import { Request, Response } from "express-serve-static-core";
import { initiatePaymentSchema } from "./payment.validation.ts";
import { inititatePaymentService } from "./payment.service.ts";

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

         const result = inititatePaymentService(req.body);

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

export {inititatePayment}