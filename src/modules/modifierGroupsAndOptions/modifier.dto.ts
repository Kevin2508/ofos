export interface CreateModifierGroupDto {
  name: string;
  isRequired: boolean;
  minSelection: number;
  maxSelection: number;

  options: {
    optionName: string;
    additionalPrice: number;
    displayOrder: number;
  }[];
}

export interface modifierGroups{
    name?: string,
    isRequired?: boolean,
    minSelection?: number,
    maxSelection?: number,
}

export interface modifierOptionDto {
  optionName: string;
  additionalPrice?: number;
  displayOrder?: number;
}

export interface attachModifierGroupDto {
  modifierGroupId: number;
}