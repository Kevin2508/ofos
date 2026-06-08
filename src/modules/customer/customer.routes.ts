import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.ts";

import { getAddresses, getAddressesById, insertAddresses,
<<<<<<< HEAD
         updateCustomerAddress, deleteCustomerAddress, setDefaultAddress
=======
         updateCustomerAddress, deleteCustomerAddress
>>>>>>> 6cc4dc7 (customer address module is done)
 } from "./customer.controller.ts";
const customerRouter = Router();

//To get the all addresses of the customer.
customerRouter.get('/address', authenticate, getAddresses);

//To insert the customer new address into customer_addresses named TABLE.
customerRouter.post('/addresses', authenticate, insertAddresses);

//To get the addresses by customer's ID manually entered.
customerRouter.get('/addresses/:id', getAddressesById);

//To update a customer's address.
customerRouter.patch('/addresses/:id', updateCustomerAddress);

//To delete the One Of Customer Address.
customerRouter.delete('/addresses/:id', deleteCustomerAddress);
<<<<<<< HEAD

//to see the customer address default if its not set.
customerRouter.patch('/address/:id', authenticate, setDefaultAddress);
=======
>>>>>>> 6cc4dc7 (customer address module is done)
export {customerRouter}
