import { catchAsync } from "../../middlewares/catch.async.ts";
import { Request, Response } from "express-serve-static-core";
import {
  addAddressService, getAddressesByIdService, getAddressesService,
  updateAdressService, deleteAddressService, setDefaultAddressService,
  getPreferencesService, updatePreferencesService,
  getPaymentMethodsService, addPaymentMethodService, deletePaymentMethodService
} from "./customer.service.ts";
import { customerDto } from "./customer.dto.ts";
import { createAddressSchema } from "./customer.valication.ts";
import { updateUser, findUserById } from "../user/user.repository.ts";
import { getUserSessions, revokeUserSession } from "../auth/auth.repository.ts";
import bcrypt from 'bcryptjs';


const getAddresses = catchAsync(
  async (req: Request, res: Response) => {

    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const result = await getAddressesService(req.user as customerDto);

    return res.status(201).json({
      status: result.success ? 'success' : 'fail',
      message: result.message,
      data: result.data
    });
  }
);

const insertAddresses = catchAsync(
  async (req: Request, res: Response) => {

    const { error, value } = createAddressSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        status: 'fail in validation',
        errors: error.details.map(
          detail => detail.message
        ),
      });
    }

    const result = await addAddressService(req.user as customerDto, value);

    return res.status(201).json({
      status: result.message ? 'success' : 'fail',
      message: result.message,
      data: result.data
    });
  }
)

const getAddressesById = catchAsync(
  async (req: Request, res: Response) => {

    const customerId = Number(req.params.id);

    if (isNaN(customerId)) {
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

    if (serializedData.data.length === 0) {
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
  async (req: Request, res: Response) => {

    const addressId = Number(req.params.id);

    if (isNaN(addressId)) {
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

    if (error) {
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

    if (serializeVal.data === null) {

      return res.status(404).json({
        status: 'fail',
        message: serializeVal.message,
        data: serializeVal.data,
      });
    }

    return res.status(serializeVal.data ? 200 : 404).json({
      status: serializeVal.data ? 'success' : 'fail',
      message: serializeVal.message,
      data: serializeVal.data,
    });

  }
)

const deleteCustomerAddress = catchAsync(

  async (req: Request, res: Response) => {
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

const setDefaultAddress = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const addressId = Number(req.params.id);

    if (isNaN(addressId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid address id',
      });
    }

    const result = await setDefaultAddressService(req.user as customerDto, addressId);

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
      const statusCode = serializedResult.message === 'Unauthorized access' ? 403 : 404;
      return res.status(statusCode).json({
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
);

const setupCustomerProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }

  const userDto = req.user as customerDto;
  const { addressLine1, city, postalCode, firstName, lastName, email, phone } = req.body;

  // Update user profileImageUrl if file is uploaded
  const dataToUpdate: any = {};
  if (req.file) {
    dataToUpdate.profileImageUrl = `/uploads/users/profiles/${req.file.filename}`;
  }
  if (firstName !== undefined) dataToUpdate.firstName = firstName;
  if (lastName !== undefined) dataToUpdate.lastName = lastName;
  if (email !== undefined) dataToUpdate.email = email;
  if (phone !== undefined) dataToUpdate.phone = phone;

  if (Object.keys(dataToUpdate).length > 0) {
    await updateUser({ userId: BigInt(userDto.id), data: dataToUpdate });
  }

  if (addressLine1 && city && postalCode) {
    const user = await findUserById(BigInt(userDto.id));
    if (user) {
      const payload = {
        label: 'HOME',
        contactName: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
        contactPhone: user.phone,
        addressLine1,
        addressLine2: '',
        city,
        postalCode,
        state: 'Unknown',
        country: 'Unknown',
        latitude: 0,
        longitude: 0,
        isDefault: true
      };
      await addAddressService(userDto, payload as any);
    }
  }

  return res.status(200).json({ status: 'success', message: 'Profile updated successfully' });
});

// Get full customer profile data (user + addresses)
const getCustomerProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const userDto = req.user as customerDto;
  const user = await findUserById(BigInt(userDto.id));
  if (!user) {
    return res.status(404).json({ status: 'error', message: 'User not found' });
  }
  const addressResult = await getAddressesService(userDto);
  const serialize = (v: any) =>
    JSON.parse(JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val)));

  return res.status(200).json({
    status: 'success',
    data: {
      user: serialize({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        createdAt: user.createdAt,
      }),
      addresses: serialize(addressResult.data || []),
    },
  });
});

// Change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const userDto = req.user as customerDto;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ status: 'fail', message: 'All password fields are required' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ status: 'fail', message: 'New passwords do not match' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ status: 'fail', message: 'New password must be at least 8 characters' });
  }

  const user = await findUserById(BigInt(userDto.id));
  if (!user || !user.passwordHash) {
    return res.status(404).json({ status: 'fail', message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ status: 'fail', message: 'Current password is incorrect' });
  }

  const isSame = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSame) {
    return res.status(400).json({ status: 'fail', message: 'New password must be different from current password' });
  }

  const saltRounds = Number(process.env.PASSWORD_HASH_SALT || 10);
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  await updateUser({ userId: BigInt(userDto.id), data: { passwordHash: hashedPassword } });

  return res.status(200).json({ status: 'success', message: 'Password changed successfully' });
});

// Session Management
const getSessions = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const userDto = req.user as customerDto;
  const sessions = await getUserSessions(BigInt(userDto.id));
  const serialize = (v: any) => JSON.parse(JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val)));
  
  return res.status(200).json({ status: 'success', data: serialize(sessions) });
});

const revokeSession = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const sessionId = Number(req.params.id);
  if (isNaN(sessionId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid session ID' });
  }
  
  await revokeUserSession(BigInt(sessionId));
  return res.status(200).json({ status: 'success', message: 'Session revoked successfully' });
});

// Preferences
const getPreferences = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  const result = await getPreferencesService(Number((req.user as customerDto).id));
  const serialize = (v: any) => JSON.parse(JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val)));
  return res.status(200).json({ status: 'success', data: serialize(result.data) });
});

const updatePreferences = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  const result = await updatePreferencesService(Number((req.user as customerDto).id), req.body);
  const serialize = (v: any) => JSON.parse(JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val)));
  return res.status(200).json({ status: 'success', message: result.message, data: serialize(result.data) });
});

// Payment Methods
const getPaymentMethods = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  const result = await getPaymentMethodsService(Number((req.user as customerDto).id));
  const serialize = (v: any) => JSON.parse(JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val)));
  return res.status(200).json({ status: 'success', data: serialize(result.data) });
});

const addPaymentMethod = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  const result = await addPaymentMethodService(Number((req.user as customerDto).id), req.body);
  const serialize = (v: any) => JSON.parse(JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val)));
  if (!result.success) {
    return res.status(400).json({ status: 'error', message: result.message });
  }
  return res.status(201).json({ status: 'success', message: result.message, data: serialize(result.data) });
});

const deletePaymentMethod = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  const result = await deletePaymentMethodService(Number(req.params.id));
  return res.status(200).json({ status: 'success', message: result.message });
});

export { 
  getAddresses, insertAddresses, getAddressesById, updateCustomerAddress, 
  deleteCustomerAddress, setDefaultAddress, setupCustomerProfile, 
  getCustomerProfile, changePassword, getSessions, revokeSession,
  getPreferences, updatePreferences, getPaymentMethods, addPaymentMethod, deletePaymentMethod
}