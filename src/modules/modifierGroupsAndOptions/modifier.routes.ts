import { Router } from "express";
import { getAllModifierGroups, createModifierGroup, updateModifierGroup, deleteModifierGroup,
    createModifierOption, updateModifierOption, deleteModifierOption, attachModifierGroup,detachModifierGroup
 } from "./modifier.controller.ts";
const modifierRouter = Router();

//To get All Modifier Groups.
modifierRouter.get('/branches/:id',getAllModifierGroups);

//To insert modifier groups with its options available.
modifierRouter.post('/branches/:id/modifier-group', createModifierGroup);

//To update the modifier group name, rules(min/max), or required flag.
modifierRouter.patch('/branches/modifier-groups/:id', updateModifierGroup);

//To delete modifier groups.
modifierRouter.delete('/modifier-groups/:id',deleteModifierGroup);

//To add an option to an existing modifier group.
modifierRouter.post('/modifier-groups/:groupId/options',createModifierOption);

modifierRouter.patch('/modifier-options/:id',updateModifierOption);

modifierRouter.delete('/modifier-options/:id',deleteModifierOption);

modifierRouter.post('/menu-items/:itemId/modifier-groups',attachModifierGroup);

modifierRouter.delete('/menu-items/:itemId/modifier-groups/:groupId',detachModifierGroup);
export {modifierRouter};