import { NextFunction } from "express";
import { catchAsync } from "../../middlewares/catch.async.ts";
import { createRefundSchema, updateRefundStatusSchema } from "./refund.validation.ts"; 
import { Request, Response } from "express-serve-static-core";
import { createRefundService,
         getRefundByOrderIdService,
         getAllRefundsService,
         updateRefundStatusService
 } from "./refund.service.ts";


const createRefund = catchAsync(
    async(req:Request, res:Response, next:NextFunction) =>{

        const { error } = createRefundSchema.validate(req.body, {
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

        const result =  await createRefundService(req.body);


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

        return res.status(201).json({
            status: 'success',
            message: serializedResult.message,
            data: serializedResult.data
        });
    }
)

const getRefundByOrderId = catchAsync(
    async(req:Request, res:Response) =>{

          const orderId = Number( req.params.orderId);

        if (isNaN(orderId)) {

            return res.status(400).json({
                status: 'fail',
                message:
                    'Invalid order id'
            });

        }

        const result = await getRefundByOrderIdService( orderId );

        const serializedResult =
            JSON.parse(
                JSON.stringify(
                    result,
                    (_, value) =>
                        typeof value ===
                        'bigint'
                            ? value.toString()
                            : value
                )
            );

        return res.status(200).json({
            status: 'success',
            message: serializedResult.message,
            data: serializedResult.data
        });
    }
)

const getAllRefunds = catchAsync(
    async(req:Request, res:Response) =>{

        const page:number = Number(req.query.page) || 1;
        const limit:number = Number(req.query.limit) || 10;

        const result = await getAllRefundsService({
            page,limit,
            status:req.query.status as string,
            fromDate: req.query.fromDate as string,
            toDate: req.query.toDate as string
        });

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

        res.status(200).json({
            status: 'success',
            message: serializedResult.message,
            data: serializedResult.data,
            pagination: serializedResult.pagination
        })    
    }
)

const changeRefundStatus = catchAsync(
    async(req:Request, res:Response) =>{

        const refundId:number = Number(req.params.refundId);

        if(isNaN(refundId)){
            return res.status(400).json({
                status: 'Fail',
                message: 'Invalid Refund Id'
            })
        }

        const { error } = updateRefundStatusSchema.validate(req.body, {
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


         const result = await updateRefundStatusService(refundId, req.body);

         const serializedResult = JSON.parse(
             JSON.stringify(result, (__, value) =>
                 typeof value === 'bigint' ? value.toString() : value
             )
         );

         return res.status(200).json({
            status: 'success',
            message: serializedResult.message,
            data: serializedResult.data
         })
    }
)

export {createRefund, getRefundByOrderId, getAllRefunds, changeRefundStatus}