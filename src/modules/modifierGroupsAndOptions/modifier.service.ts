import { findModifierGroupsByBranchId,
          createModifierGroupAndOptions,
          findModifierGroupById,
          updateModifierGroupById,
          findMenuItemModifierGroupLinks,
          deleteModifierOptionsByGroupId,
          deleteModifierGroupById, findModifierOptionByName,
          createModifierOption,
          findModifierOptionById,
          findDuplicateOptionName,
          updateModifierOptionById,
          deleteModifierOptionById,
          findMenuItemById,
          findMenuItemModifierGroup,
          attachModifierGroupToMenuItem,
          detachModifierGroupFromMenuItem
 } from "./modifier.repository.ts";
import { CreateModifierGroupDto, modifierGroups, modifierOptionDto } from "./modifier.dto.ts";
async function getAllModifierGroupsService(branchId:number){

    const modifierGroups = await findModifierGroupsByBranchId(branchId);

    if(modifierGroups.length === 0){
        return {
        message: 'Modifier groups are empty for this branch.',
        data: modifierGroups
    }
    }
    return {
        message: 'Modifier groups fetched successfuly.',
        data: modifierGroups
    }
}

async function createModifierGroupService(branchId:number, payload:CreateModifierGroupDto){

      const modifierGroup = await createModifierGroupAndOptions(branchId, payload);

      return ({
        message: 'Modifier group created successfully..',
        data: modifierGroup,
      })
}

async function updateModifierGroupService(modifierGroupId: number, payload: modifierGroups){

    const existingGroup = await findModifierGroupById(modifierGroupId);

    if(!existingGroup){
        return{
            message: 'Modifier group not found.',
            data: null,
        };
    }

    const updateGroup = await updateModifierGroupById(modifierGroupId, payload);

    return{
        message: 'Modifier group updated successfully.',
        data: updateGroup,
    };
}

async function deleteModifierGroupService(modifierGroupId: number) {

  const existingGroup =  await findModifierGroupById(modifierGroupId);

  if (!existingGroup) {
    return {
      message: 'Modifier group not found',
      data: null,
    };
  }

  const linkedMenuItems = await findMenuItemModifierGroupLinks( modifierGroupId );

  if (linkedMenuItems.length > 0) {
    return {
      message:
        'Modifier group is attached to menu items and cannot be deleted',
      data: null,
    };
  }

  await deleteModifierOptionsByGroupId( modifierGroupId );

  const deletedGroup = await deleteModifierGroupById( modifierGroupId );

  return {
    message:'Modifier group deleted successfully',
    data: deletedGroup,
  };
}

async function createModifierOptionService(modifierGroupId: number,payload: modifierOptionDto) {

  const modifierGroup = await findModifierGroupById(modifierGroupId);

  if (!modifierGroup) {
    return {
      message:
        'Modifier group not found',
      data: null,
    };
  }

  const existingOption = await findModifierOptionByName(modifierGroupId,payload.optionName);

  if (existingOption) {
    return {
      message:
        'Modifier option already exists',
      data: null,
    };
  }

  const option = await createModifierOption(modifierGroupId,payload);

  return {
    message:
      'Modifier option created successfully',
    data: option,
  };
}

async function updateModifierOptionService( optionId: number, payload: modifierOptionDto) {

  const existingOption = await findModifierOptionById(optionId);

  if (!existingOption) {
    return {
      message:
        'Modifier option not found',
      data: null,
    };
  }

  if (payload.optionName) {

    const duplicateOption = await findDuplicateOptionName(
        existingOption.modifierGroupId,
        payload.optionName,
        optionId
      );

    if (duplicateOption) {
      return {
        message:
          'Modifier option already exists',
        data: null,
      };
    }
  }

  const updatedOption = await updateModifierOptionById(optionId,payload);

  return {
    message:
      'Modifier option updated successfully',
    data: updatedOption,
  };
}

async function deleteModifierOptionService(optionId: number) {

  const existingOption = await findModifierOptionById(optionId);

  if (!existingOption) {
    return {
      message:
        'Modifier option not found',
      data: null,
    };
  }

  const deletedOption = await deleteModifierOptionById(optionId);

  return {
    message:'Modifier option deleted successfully',
    data: deletedOption,
  };
}

async function attachModifierGroupService(  itemId: number,  modifierGroupId: number) {

  const menuItem = await findMenuItemById(itemId);

  if (!menuItem) {
    return {
      message: 'Menu item not found',
      data: null,
    };
  }

  const modifierGroup = await findModifierGroupById(modifierGroupId );

  if (!modifierGroup) {
    return {
      message:
        'Modifier group not found',
      data: null,
    };
  }

  const existingLink = await findMenuItemModifierGroup(  itemId,  modifierGroupId);

  if (existingLink) {
    return {
      message:
        'Modifier group already attached to menu item',
      data: null,
    };
  }

  const attachedGroup = await attachModifierGroupToMenuItem(   itemId,   modifierGroupId );

  return {
    message:
      'Modifier group attached successfully',
    data: attachedGroup,
  };
}

async function detachModifierGroupService(  itemId: number,  modifierGroupId: number) {

  const menuItem =  await findMenuItemById(itemId);

  if (!menuItem) {
    return {
      message: 'Menu item not found',
      data: null,
    };
  }

  const modifierGroup =  await findModifierGroupById(  modifierGroupId  );

  if (!modifierGroup) {
    return {
      message: 'Modifier group not found',
      data: null,
    };
  }

  const existingLink =   await findMenuItemModifierGroup(  itemId,  modifierGroupId   );

  if (!existingLink) {
    return {
      message:'Modifier group is not attached to this menu item',
      data: null,
    };
  }

  const detachedGroup = await detachModifierGroupFromMenuItem( itemId, modifierGroupId );

  return {
    message: 'Modifier group detached successfully',
    data: detachedGroup,
  };
}
export {getAllModifierGroupsService, createModifierGroupService, updateModifierGroupService, deleteModifierGroupService, createModifierOptionService,
    updateModifierOptionService, deleteModifierOptionService, attachModifierGroupService, detachModifierGroupService
}