import { Router } from 'express';

import jwt from 'jsonwebtoken';

const userPageRouter = Router();

userPageRouter.get('/', (req, res) => {
    const token = req.cookies?.accessToken;
    if (token) {
        try {
            const secret = process.env.JWT_ACCESS_SECRET as string;
            jwt.verify(token, secret);

            const activeRole = req.cookies?.activeRole;

            if (activeRole) {
                switch (activeRole) {
                    case 'Customer': return res.render('customer/dashboard');
                    case 'Admin': return res.render('admin/dashboard');
                    case 'Restaurant_owner': return res.render('restaurantOwner/dashboard');
                    case 'Restaurant_staff': return res.render('restaurantStaff/dashboard');
                    case 'Delivery_partner': return res.render('deliveryPartner/dashboard');
                    case 'Fleet_manager': return res.render('fleetManager/dashboard');
                    case 'Finance_manager': return res.render('finance/dashboard');
                    default: return res.redirect('/role-selection');
                }
            } else {
                return res.redirect('/role-selection');
            }
        } catch (err) {
            // Token invalid or expired, fallback to user dashboard
        }
    }
    res.render('user/dashboard');
});

userPageRouter.get('/restaurant/:id', (req, res, next) => {
    const acceptHeader = req.headers.accept || "";
    if (acceptHeader.includes("application/json") || !acceptHeader.includes("text/html")) {
        return next();
    }
    res.render('user/restaurant');
});

userPageRouter.get('/branchPage/:id', (req, res, next) => {
    const acceptHeader = req.headers.accept || "";
    if (acceptHeader.includes("application/json") || !acceptHeader.includes("text/html")) {
        return next();
    }
    res.render('user/branch');
});

export { userPageRouter };
