import { Job } from "../../models/job.js";

export const getDomains = async (req, res, next) => {
    try {
        const domains = await Job.find({}, { domain: 1, _id: 1 });
        res.json({ success: true, domains: domains.map(d => ({ id: d._id, domain: d.domain })) });
    } catch (error) {
        next(error);
    }
};

export const getJobRoles = async (req, res, next) => {
    try {
        const { domainId } = req.params;
        const record = await Job.findById(domainId);

        if (!record) {
            return res.status(404).json({ success: false, message: "Domain not found" });
        }

        res.json({ success: true, domain: record.domain, jobRoles: record.job_roles });
    } catch (error) {
        next(error);
    }
};
