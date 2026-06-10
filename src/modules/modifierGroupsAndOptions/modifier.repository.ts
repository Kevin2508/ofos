import { options } from "joi";
import { prisma } from "../../config/prisma.ts"
import { CreateModifierGroupDto, modifierGroups, modifierOptionDto } from "./modifier.dto.ts";

async function findModifierGroupsByBranchId(branchId:number){

    return await prisma.modifierGroup.findMany({
        where:{
            branchId: BigInt(branchId)
        },
        orderBy: {
            id: 'desc',
        },
        include: {
            options: true,
        }
    });
}

async function createModifierGroupAndOptions(branchId: number, payload:CreateModifierGroupDto){

    return await prisma.modifierGroup.create({
        data: {
            branchId: BigInt(branchId),

            name: payload.name,
            isRequired: payload.isRequired,
            minSelection: payload.minSelection,
            maxSelection: payload.maxSelection,

            options: {
                create: payload.options.map(option => ({
                    optionName: option.optionName,
                    additionalPrice: option.additionalPrice,
                    displayOrder: option.displayOrder,
                })),
            },
        },

        include: {
            options: true,
        },
    })
}

async function findModifierGroupById(modifierGroupId:number){
    return await prisma.modifierGroup.findUnique({
        where: {
            id: BigInt(modifierGroupId),
        },
    });
}

async function updateModifierGroupById(modifierGroupId: number, payload: modifierGroups){
    return await prisma.modifierGroup.update({
        where: {
            id: BigInt(modifierGroupId),
        },
        data : payload,
    });
}

async function findMenuItemModifierGroupLinks( modifierGroupId: number) {
  return await prisma.menuItemModifierGroup.findMany({
    where: {
      modifierGroupId: BigInt(modifierGroupId),
    },
  });
}

async function deleteModifierOptionsByGroupId( modifierGroupId: number) {
  return await prisma.modifierOption.deleteMany({
    where: {
      modifierGroupId: BigInt(modifierGroupId),
    },
  });
}

async function deleteModifierGroupById( modifierGroupId: number) {
  return await prisma.modifierGroup.delete({
    where: {
      id: BigInt(modifierGroupId),
    },
  });
}

async function findModifierOptionByName( modifierGroupId: number, optionName: string) {
  return await prisma.modifierOption.findFirst({
    where: {
      modifierGroupId: BigInt(modifierGroupId),
      optionName,
    },
  });
}

async function createModifierOption( modifierGroupId: number,payload: modifierOptionDto) {
  return await prisma.modifierOption.create({
    data: {
      modifierGroupId: BigInt(modifierGroupId),

      optionName: payload.optionName,

      additionalPrice: payload.additionalPrice ?? 0,

      displayOrder: payload.displayOrder ?? 0,
    },
  });
}

async function findModifierOptionById( optionId: number) {
  return await prisma.modifierOption.findUnique({
    where: {
      id: BigInt(optionId),
    },
  });
}

async function findDuplicateOptionName( modifierGroupId: bigint, optionName: string, optionId: number) {
  return await prisma.modifierOption.findFirst({
    where: {
      modifierGroupId,
      optionName,

      NOT: {
        id: BigInt(optionId),
      },
    },
  });
}

async function updateModifierOptionById(
  optionId: number,
  payload: modifierOptionDto
) {
  return await prisma.modifierOption.update({
    where: {
      id: BigInt(optionId),
    },
    data: payload,
  });
}

async function deleteModifierOptionById(optionId: number) {
  return await prisma.modifierOption.delete({
    where: {
      id: BigInt(optionId),
    },
  });
}

async function findMenuItemById(  itemId: number) {
  return await prisma.menuItem.findUnique({
    where: {
      id: BigInt(itemId),
    },
  });
}

async function findMenuItemModifierGroup(  itemId: number,  modifierGroupId: number) {
  return await prisma.menuItemModifierGroup.findUnique({
    where: {
      menuItemId_modifierGroupId: {
        menuItemId: BigInt(itemId),
        modifierGroupId: BigInt(modifierGroupId),
      },
    },
  });
}

async function attachModifierGroupToMenuItem(  itemId: number,  modifierGroupId: number) {
  return await prisma.menuItemModifierGroup.create({
    data: {
      menuItemId: BigInt(itemId),
      modifierGroupId: BigInt(
        modifierGroupId
      ),
    },
  });
}

async function detachModifierGroupFromMenuItem(  itemId: number,  modifierGroupId: number) {
  return await prisma.menuItemModifierGroup.delete({
    where: {
      menuItemId_modifierGroupId: {
        menuItemId: BigInt(itemId),
        modifierGroupId: BigInt( modifierGroupId),
      },
    },
  });
}

export {findModifierGroupsByBranchId, createModifierGroupAndOptions,
      findModifierGroupById, updateModifierGroupById, findMenuItemModifierGroupLinks, deleteModifierOptionsByGroupId, deleteModifierGroupById,
      findModifierOptionByName, createModifierOption,
      findModifierOptionById, findDuplicateOptionName, updateModifierOptionById,
      deleteModifierOptionById,
      findMenuItemById,
      findMenuItemModifierGroup,
      attachModifierGroupToMenuItem,
      detachModifierGroupFromMenuItem
}