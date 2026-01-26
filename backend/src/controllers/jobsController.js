import { Job } from "../models/job.js";
import { InterviewService } from "../services/interviewService.js";

const interviewService = new InterviewService();
export const getDomains = async (req, res, next) => {
    try {
        const domains = await Job.find({});
        const formattedDomains = domains.map((d) => ({
            id: d._id,
            domain: d.domain,
        }));
        res.status(200).json({ success: true, domains: formattedDomains });
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
        res.status(200).json({ success: true, domain: record.domain, jobRoles: record.job_roles });
    } catch (error) {
        next(error);
    }
};

export const searchJobRoles = async (req, res, next) => {
    try {
        const { searchedRole } = req.query;

        const roles = await Job.aggregate([
            {
                $unwind: "$job_roles",
            },
            {
                $match: {
                    job_roles: { $regex: searchedRole, $options: "i" },
                },
            },
            {
                $project: {
                    value: "$job_roles",
                },
            },
        ]);

        const jobRoles = roles.map(r => r.value);
        res.status(200).json({ success: true, jobRoles });
    } catch (error) {
        next(error);
    }
};

export const recommendedSkills = async (req, res, next) => {
    try {
        const { domain, jobRole } = req.body;

        const skills = await interviewService.getTopSkills(domain, jobRole);
        res.status(200).json({ success: true, skills: skills });
    } catch (error) {
        next(error);
    }
}