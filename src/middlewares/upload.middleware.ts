import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname == 'delivery-partner-document') {
      cb(null, './uploads/deliveryPartners/documents');
    }
    // else if (file.fieldname == "coverPicture") {
    //   cb(null, "./uploads/users/covers");
    // } else if (file.fieldname == "postPictures") {
    //   cb(null, "./uploads/posts");
    // }
    else {
    if (file.fieldname == 'profilePicture') {
      cb(null, './uploads/users/profiles');
    } else if (file.fieldname == 'coverPicture') {
      cb(null, './uploads/users/covers');
    } else if (file.fieldname == 'postPictures') {
      cb(null, './uploads/posts');
    } else if (file.fieldname === 'logo') {
      cb(null, './uploads/restaurants/logos');
    } else if (file.fieldname === 'cover') {
      cb(null, './uploads/restaurants/covers');
    } else if (file.fieldname === 'document') {
      cb(null, './uploads/restaurants/documents');
    } else {
      cb(null, './uploads/any');
    }}
  },
  filename: (req, file, cb) => {
    const ext: string = path.extname(file.originalname);
    const date = new Date();
    let fileName;
    if (file.fieldname == 'delivery-partner-document') {
      cb(null, './uploads/deliveryPartners/documents');
      fileName = date.getTime() + '_' + 'document' + ext;
    } else {
      fileName = 'any_' + date.getTime() + ext;
    if (req.body.userName) {
      fileName = date.getTime() + '_' + req.body.userName + ext;
    } else {
      fileName = 'post_' + date.getTime() + ext;
    }
    if (file.fieldname == 'delivery-partner-document') {
      cb(null, './uploads/deliveryPartners/documents');
      fileName = date.getTime() + '_' + 'document' + ext;
    } else {
      fileName = 'any_' + date.getTime() + ext;
    }
    cb(null, fileName);
  }},
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

const upload = multer({ storage, limits, fileFilter });

export { upload };
