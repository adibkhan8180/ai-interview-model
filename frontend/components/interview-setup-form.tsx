"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
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
import { useInterviewStore } from "@/lib/store/interviewStore";

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
    interviewCategory: "HR",
    domain: "",
    jobDescription: "",
    inputType: "skills-based",
    skills: [],
  });

  const [skill, setSkill] = useState("");
  const [steps, setSteps] = useState(1);
  const { saveFormData } = useFormStore();
  const { setInterviewStarted } = useInterviewStore();
  const isDomainSpecific = formData.interviewCategory === "domain-specific";
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skill.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skill.trim())) {
        setFormData((prev) => ({
          ...prev,
          skills: [...prev.skills, skill.trim()],
        }));
      }
      setSkill("");
    }
  };

  const removeSkill = (removedSkill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== removedSkill),
    }));
  };

  const handleStartInterview = () => {
    saveFormData(formData);
    onSubmit(formData);
    setInterviewStarted(true);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (steps === 1) {
          if (formData.companyName && formData.jobRole) {
            setSteps(2);
          } else {
            inputRef.current?.focus();
          }
        } else if (steps === 2) {
          if (
            formData.interviewCategory &&
            (formData.interviewCategory !== "domain-specific" ||
              formData.domain)
          ) {
            setSteps(3);
          } else {
            inputRef.current?.focus();
          }
        } else if (steps === 3) {
          if (
            (formData.inputType === "skills-based" &&
              formData.skills.length > 0) ||
            (formData.inputType === "job-description" &&
              formData.jobDescription.trim() !== "")
          ) {
            // handleStartInterview();
          } else {
            inputRef.current?.focus();
          }
        }
      }

      if (event.key === "Escape") {
        if (steps === 3) {
          setSteps(2);
        } else if (steps === 2) {
          setSteps(1);
        } else {
          return null;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [formData, steps, handleStartInterview]);

  if (steps !== 1 && steps !== 2 && steps !== 3) return null;

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">
        <span className="text-[#3B64F6]">AI-Video</span> Interview Setup
      </h1>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-4">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#3B64F6] ${
              steps === 1
                ? "bg-[#E7ECFF] text-[#3B64F6]"
                : "bg-[#3B64F6] text-[#fff]"
            } `}
            onClick={() => {
              if (steps > 1) setSteps(1);
            }}
          >
            1
          </div>
          <div
            className={`h-0.5 w-12  ${
              steps > 1 ? "bg-[#3B64F6]" : "bg-[#E2E8F0]"
            }`}
          ></div>
        </div>

        <div className="flex items-center space-x-4">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              steps === 2
                ? "bg-[#E7ECFF] text-[#3B64F6] border-[#3B64F6]"
                : steps > 2
                ? "bg-[#3B64F6] text-[#fff] border-[#3B64F6]"
                : "border-[#E2E8F0] text-gray-400 "
            } `}
            onClick={() => {
              if (steps > 2) setSteps(2);
            }}
          >
            2
          </div>
          <div
            className={`h-0.5 w-12  ${
              steps > 2 ? "bg-[#3B64F6]" : "bg-[#E2E8F0]"
            }`}
          ></div>
        </div>

        <div className="flex items-center space-x-4">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              steps === 3
                ? "bg-[#E7ECFF] text-[#3B64F6] border-[#3B64F6]"
                : steps > 3
                ? "bg-[#3B64F6] text-[#fff] border-[#3B64F6]"
                : "border-[#E2E8F0] text-gray-400 "
            } `}
            onClick={() => {
              if (steps > 3) setSteps(3);
            }}
          >
            3
          </div>
        </div>
      </div>

      <Card className="w-md z-10">
        <CardHeader>
          <CardTitle className="text-base text-[#4F637E] text-center font-normal">
            {steps === 1 ? (
              <p>
                Tell us where you&apos;re aiming and what role you&apos;re
                targeting.
              </p>
            ) : steps === 2 ? (
              <p>What kind of interview would you like to simulate?</p>
            ) : (
              <p>How should we generate your interview questions?</p>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {steps === 1 ? (
            <div className="flex flex-col gap-4">
              <div>
                <Label
                  htmlFor="companyName"
                  className="text-base text-black capitalize"
                >
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  ref={inputRef}
                  placeholder="eg. TruScholar"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="px-3 py-2"
                />
              </div>
              <div>
                <Label
                  htmlFor="jobRole"
                  className="text-base text-black capitalize"
                >
                  Job Role
                </Label>
                <Input
                  id="jobRole"
                  name="jobRole"
                  placeholder="eg. Frontend Developer"
                  value={formData.jobRole}
                  onChange={handleChange}
                  required
                  className="px-3 py-2"
                />
              </div>

              <Button
                onClick={() => setSteps(2)}
                className="text-base font-bold cursor-pointer"
                disabled={
                  formData.companyName === "" || formData.jobRole === ""
                }
              >
                Next
              </Button>
            </div>
          ) : steps === 2 ? (
            <div className="flex flex-col gap-4">
              <div className="w-full ">
                <Label
                  htmlFor="interviewCategory"
                  className="text-base text-black capitalize"
                >
                  Interview Category
                </Label>
                <Select
                  value={formData.interviewCategory}
                  onValueChange={(value) =>
                    handleSelectChange("interviewCategory", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="eg. HR" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="domain-specific">
                      Domain-specific
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isDomainSpecific && (
                <div className=" w-full">
                  <Label
                    htmlFor="domain"
                    className="text-base text-black capitalize"
                  >
                    Select Domain
                  </Label>
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

              <Button
                onClick={() => setSteps(3)}
                className="text-base font-bold cursor-pointer"
                disabled={
                  formData.interviewCategory === "" ||
                  (formData.interviewCategory === "domain-specific" &&
                    formData.domain === "")
                }
              >
                Next
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <RadioGroup
                defaultValue="skills-based"
                value={formData.inputType}
                onValueChange={(value) =>
                  handleSelectChange("inputType", value)
                }
                className="flex gap-6"
              >
                <div className="flex items-center gap-2 cursor-pointer w-fit">
                  <RadioGroupItem value="skills-based" id="skills-based" />
                  <Label
                    htmlFor="skills-based"
                    className="cursor-pointer text-base text-black capitalize"
                  >
                    Skills - Based
                  </Label>
                </div>
                <div className="flex items-center gap-2 cursor-pointer w-fit">
                  <RadioGroupItem
                    value="job-description"
                    id="job-description"
                  />
                  <Label
                    htmlFor="job-description"
                    className="cursor-pointer text-base text-black capitalize"
                  >
                    Job Description Based
                  </Label>
                </div>
              </RadioGroup>

              {formData.inputType === "skills-based" ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Type a skill and press Enter"
                    ref={inputRef}
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
                onClick={handleStartInterview}
                className="text-base font-bold cursor-pointer"
                disabled={
                  (formData.inputType === "skills-based" &&
                    formData.skills.length === 0) ||
                  (formData.inputType === "job-description" &&
                    formData.jobDescription === "") ||
                  loading
                }
              >
                {loading ? "Starting Interview..." : "Start Interview"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
