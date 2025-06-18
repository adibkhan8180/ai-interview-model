export const validateStartInterview = (req, res, next) => {
    const { companyName, jobRole, jobDescription, interviewType } = req.body;

    if (!companyName || !jobRole || !jobDescription) {
        return res.status(400).json({
            success: false,
            message: 'Company name, job role, and job description are required'
        });
    }

    if (!['HR', 'technical', 'behavioral', 'general', 'domain_specific'].includes(interviewType)) {
        return res.status(400).json({
            success: false,
            message: 'Interview type must be one of: HR, technical, behavioral, general, domain_specific'
        });
    }

    next();
};

export const validateContinueInterview = (req, res, next) => {
    const { studentAnswer, isRevised } = req.body;
    const { sessionId } = req.params;

    if (!sessionId) {
        return res.status(400).json({
            success: false,
            message: 'Session ID is required'
        });
    }

    if (!studentAnswer && isRevised !== 'yes') {
        return res.status(400).json({
            success: false,
            message: 'Student answer is required if not continuing'
        });
    }

    if (isRevised && isRevised !== 'yes' && isRevised !== 'no') {
        return res.status(400).json({
            success: false,
            message: 'isRevised must be yes or no'
        });
    }

    next();
};
