import { DocumentType } from "../../generated/prisma/enums.ts";

interface createRestaurantDto {
  businessName: string;
  legalBusinessName: string;
  primaryPhone: string;
  primaryEmail: string;
  description?: string;
}

interface updateRestaurantDto {
  businessName?: string;
  description?: string;
  primaryPhone?: string;
  primaryEmail?: string;
}

interface uploadDocumentDto {
  documentType: DocumentType;
}

interface pauseRestaurantDto {
  resumeAt?: string;
}

interface restaurantParamsDto {
  id: string;
}

export type {
  createRestaurantDto,
  updateRestaurantDto,
  uploadDocumentDto,
  pauseRestaurantDto,
  restaurantParamsDto,
};