"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface InterviewSetupData {
  companyName: string;
  jobRole: string;
  interviewCategory: "general" | "hr" | "domain-specific";
  domain?: string;
  jobDescription: string;
}

interface InterviewSetupFormProps {
  onSubmit: (data: InterviewSetupData) => void;
  loading: boolean;
}

export function InterviewSetupForm({
  onSubmit,
  loading,
}: InterviewSetupFormProps) {
  const [formData, setFormData] = useState<InterviewSetupData>({
    companyName: "",
    jobRole: "",
    interviewCategory: "general",
    domain: "",
    jobDescription: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isDomainSpecific = formData.interviewCategory === "domain-specific";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          AI Video Interview Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                placeholder="Enter company name"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobRole">Job Role</Label>
              <Input
                id="jobRole"
                name="jobRole"
                placeholder="e.g., Frontend Developer"
                value={formData.jobRole}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interviewCategory">Interview Category</Label>
            <Select
              value={formData.interviewCategory}
              onValueChange={(value) =>
                handleSelectChange("interviewCategory", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interview type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="domain-specific">Domain-specific</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isDomainSpecific && (
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                name="domain"
                placeholder="e.g., Frontend Development, Machine Learning"
                value={formData.domain}
                onChange={handleChange}
                required={isDomainSpecific}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="jobDescription">
              {isDomainSpecific
                ? "Detailed Job Description"
                : "Job Description"}
            </Label>
            <Textarea
              id="jobDescription"
              name="jobDescription"
              placeholder={
                isDomainSpecific
                  ? "Paste the detailed job description including responsibilities and required skills..."
                  : "Paste the job description here..."
              }
              value={formData.jobDescription}
              onChange={handleChange}
              className="min-h-[150px]"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Starting..." : "Start AI Video Interview"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
