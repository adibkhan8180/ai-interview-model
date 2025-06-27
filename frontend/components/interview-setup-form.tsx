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
import { useFormStore } from "@/lib/store/formStore";
import { InterviewSetupData } from "@/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "./ui/badge";
import { IoMdClose } from "react-icons/io";

interface InterviewSetupFormProps {
  onSubmit: (data: InterviewSetupData) => void;
  loading: boolean;
}

export function InterviewSetupForm({
  onSubmit,
  loading,
}: InterviewSetupFormProps) {
  const [skill, setSkill] = useState("");
  const { formData, setFormData } = useFormStore();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isDomainSpecific = formData.interviewCategory === "domain-specific";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skill.trim()) {
      e.preventDefault();
      if (!formData?.skills?.includes(skill.trim())) {
        setFormData({ skills: [...(formData.skills || []), skill.trim()] });
      }
      setSkill("");
    }
  };

  const removeSkill = (removedSkill: string) => {
    setFormData({
      skills: (formData.skills || []).filter((s) => s !== removedSkill),
    });
  };

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

          <div className="flex gap-4">
            <div className="space-y-2 w-1/2">
              <Label htmlFor="interviewCategory">Interview Category</Label>
              <Select
                value={formData.interviewCategory}
                onValueChange={(value) =>
                  handleSelectChange("interviewCategory", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select interview type" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="domain-specific">
                    Domain-specific
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isDomainSpecific && (
              <div className="space-y-2 w-1/2">
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
          </div>

          <RadioGroup
            defaultValue="skills-based"
            value={formData.inputType}
            onValueChange={(value) => handleSelectChange("inputType", value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2 cursor-pointer w-fit">
              <RadioGroupItem value="skills-based" id="skills-based" />
              <Label htmlFor="skills-based" className="cursor-pointer">
                Skills Based (recommended)
              </Label>
            </div>
            <div className="flex items-center space-x-2 cursor-pointer w-fit">
              <RadioGroupItem value="job-description" id="job-description" />
              <Label htmlFor="job-description" className="cursor-pointer">
                Job Description
              </Label>
            </div>
          </RadioGroup>
          {formData.inputType === "skills-based" ? (
            <div className="space-y-2">
              <Input
                placeholder="Type a skill and press Enter"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <div className="flex flex-wrap gap-2">
                {formData?.skills?.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {skill}
                    <p
                      className="cursor-pointer"
                      onClick={() => removeSkill(skill)}
                    >
                      x
                    </p>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
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
          )}

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={loading}
          >
            {loading
              ? "Starting Your Interview..."
              : "Start AI Video Interview"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
