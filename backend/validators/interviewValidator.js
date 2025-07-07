import Joi from 'joi';

export const startInterviewSchema = Joi.object({
    companyName: Joi.string().trim().min(1).max(40).required(),
    jobRole: Joi.string().required(),
    inputType: Joi.string().valid('job-description', 'skills-based').required(),
    jobDescription: Joi.when('inputType', {
        is: 'job-description',
        then: Joi.string().min(100).max(2000).required(),
        otherwise: Joi.optional(),
    }),
    skills: Joi.when('inputType', {
        is: 'skills-based',
        then: Joi.array().items(Joi.string()).min(3).max(20).required(),
        otherwise: Joi.optional(),
    }),
    interviewType: Joi.string().valid('HR', 'domain-specific').required(),
    domain: Joi.when('interviewType', {
        is: 'domain-specific',
        then: Joi.string().required(),
        otherwise: Joi.optional(),
    }),
});

export const postAnswerSchema = Joi.object({
    answer: Joi.string().min(140).max(1500).required(),
});

export const sessionIdParamSchema = Joi.object({
    sessionId: Joi.string().length(24).hex().required(),
});
