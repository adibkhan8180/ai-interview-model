import Joi from "joi";

export const domainIdParamSchema = Joi.object({
    domainId: Joi.string().length(24).hex().required(),
});

export const searchJobRolesQuerySchema = Joi.object({
    searchedRole: Joi.string().trim().min(2).max(50).required(),
});