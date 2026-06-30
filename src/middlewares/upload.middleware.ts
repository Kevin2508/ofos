import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profilePicture') {
      cb(null, './uploads/users/profiles');
    } else if (file.fieldname === 'logo') {
      cb(null, './uploads/restaurants/logos');
    } else if (file.fieldname === 'cover') {
      cb(null, './uploads/restaurants/covers');
    } else if (file.fieldname === 'document') {
      cb(null, './uploads/restaurants/documents');
    } else if (file.fieldname === 'delivery-partner-document' || file.fieldname === 'governmentId') {
      cb(null, './uploads/deliveryPartners/documents');
    } else if (file.fieldname === 'menuItemImage') {
      cb(null, './uploads/menu-items');
    } else if (file.fieldname === 'images') {
      cb(null, './uploads/reviews');
    } else {
      cb(null, './uploads/any');
    }
  },
  filename: (req, file, cb) => {
    const ext: string = path.extname(file.originalname);
    const date = new Date();
    let fileName: string;

    if (file.fieldname === 'delivery-partner-document' || file.fieldname === 'governmentId') {
      fileName = date.getTime() + '_' + 'document' + ext;
    } else if (file.fieldname === 'menuItemImage') {
      fileName = 'menu_item_' + date.getTime() + ext;
    } else if (file.fieldname === 'images') {
      fileName = 'review_' + date.getTime() + ext;
    } else if (file.fieldname === 'profilePicture') {
      fileName = date.getTime() + '_profile' + ext;
    } else if (file.fieldname === 'logo') {
      fileName = date.getTime() + '_logo' + ext;
    } else if (file.fieldname === 'cover') {
      fileName = date.getTime() + '_cover' + ext;
    } else if (file.fieldname === 'document') {
      fileName = date.getTime() + '_document' + ext;
    } else {
      fileName = 'any_' + date.getTime() + ext;
    }
    cb(null, fileName);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('💥 Only images are allowed'));
  }
};

const limits = {
  fields: 20,
  fileSize: 1024 * 1024 * 10,
};

const upload = multer({
  storage,
  limits,
  fileFilter,
});

export { upload };
