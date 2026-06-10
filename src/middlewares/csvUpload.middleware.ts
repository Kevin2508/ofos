import multer, {
  FileFilterCallback,
} from 'multer';

import path from 'path';

import { Request } from 'express';

/**
 * ============================================================
 * CSV STORAGE
 * ============================================================
 */

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        './uploads/csv'
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const ext =
        path.extname(
          file.originalname
        );

      const fileName =
        `menu_import_${Date.now()}${ext}`;

      cb(null, fileName);
    },
  });

/**
 * ============================================================
 * CSV VALIDATION
 * ============================================================
 */

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes =
    [
      'text/csv',
      'application/vnd.ms-excel',
    ];

  if (
    allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only CSV files are allowed'
      )
    );
  }
};

/**
 * ============================================================
 * LIMITS
 * ============================================================
 */

const limits = {
  fileSize:
    1024 * 1024 * 5,
};

/**
 * ============================================================
 * EXPORT
 * ============================================================
 */

const csvUpload = multer({
  storage,
  fileFilter,
  limits,
});

export { csvUpload };