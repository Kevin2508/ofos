import { Router } from "express";
import {
    getAddresses, getAddressesById, insertAddresses,
    updateCustomerAddress, deleteCustomerAddress, setDefaultAddress,
    setupCustomerProfile, getCustomerProfile, changePassword,
    getSessions, revokeSession,
    getPreferences,
    updatePreferences,
    addPaymentMethod,
    deletePaymentMethod,
    getPaymentMethods
} from "./customer.controller.ts";
import { upload } from "../../middlewares/upload.middleware.ts";
import { authenticate, authorize } from "../../middlewares/auth.middleware.ts";
import { getFeed, search } from './search.controller.ts';

const customerRouter = Router();

customerRouter.use(authenticate);

customerRouter.use(authorize('Customer'));

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

//to see the customer address default if its not set.
customerRouter.patch('/address/:id', authenticate, setDefaultAddress);

// Setup customer profile
customerRouter.post('/setup-profile', upload.single('profilePicture'), setupCustomerProfile);

// Get full profile data
customerRouter.get('/profile-data', getCustomerProfile);

// Change password
customerRouter.post('/change-password', changePassword);

// Sessions
customerRouter.get('/sessions', getSessions);
customerRouter.delete('/sessions/:id', revokeSession);

// Preferences
customerRouter.get('/preferences', getPreferences);
customerRouter.patch('/preferences', updatePreferences);

// Payment Methods
customerRouter.get('/payment-methods', authenticate, getPaymentMethods);
customerRouter.post('/payment-methods', authenticate, addPaymentMethod);
customerRouter.delete('/payment-methods/:id', authenticate, deletePaymentMethod);

// Feed & Search
customerRouter.get('/feed', getFeed); // optional auth inside controller
customerRouter.get('/search', search);

export { customerRouter }
