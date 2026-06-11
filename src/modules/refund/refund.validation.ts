import Joi from 'joi';

const createRefundSchema = Joi.object({
    orderId: Joi.number()
        .integer()
        .positive()
        .required(),

    reason: Joi.string()
        .trim()
        .min(5)
        .max(500)
        .required()
});
export {createRefundSchema}