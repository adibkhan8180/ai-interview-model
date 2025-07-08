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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReactMarkdown from "react-markdown";

interface InterviewSetupFormProps {
  onSubmit: (data: InterviewSetupData) => void;
  loading: boolean;
}

const maxCompanyNameLength = 30;
const maxJDLength = 1999;
const minJDLength = 100;
const maxSkillLength = 20;
const maxNoOfSkills = 5;

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

  const inputRef = useRef<HTMLInputElement>(null);
  const jobRoleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDomainSpecific = formData.interviewCategory === "domain-specific";

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

      if (skill.length < 2) return;
      if (formData.skills.length >= maxNoOfSkills) return;

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
      const { key, shiftKey } = event;

      if (key === "Enter") {
        event.preventDefault();

        if (steps === 1) {
          if (inputRef.current && !formData.companyName.trim()) {
            inputRef.current.focus();
          } else if (jobRoleRef.current && !formData.jobRole.trim()) {
            jobRoleRef.current.focus();
          } else {
            setSteps(2);
          }
        } else if (steps === 2) {
          const isValidCategory =
            formData.interviewCategory &&
            (formData.interviewCategory !== "domain-specific" ||
              formData.domain);

          if (isValidCategory) {
            setSteps(3);
          }
        } else if (steps === 3) {
          const isSkillsValid =
            formData.inputType === "skills-based" && formData.skills.length > 0;

          const isJobDescriptionValid =
            formData.inputType === "job-description" &&
            formData.jobDescription.trim() !== "";

          if (isSkillsValid || isJobDescriptionValid) {
            if (shiftKey && key === "Enter") {
              handleStartInterview();
            }
            // handleStartInterview();  //Todoauto start if trying to enter skills
          } else {
            inputRef.current?.focus();
            textareaRef.current?.focus();
          }
        }
      }

      if (key === "Escape") {
        if (steps === 3) setSteps(2);
        else if (steps === 2) setSteps(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [formData, steps, handleStartInterview]);

  if (steps !== 1 && steps !== 2 && steps !== 3) return null;

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">
        <span className="text-[#3B64F6]">AI-Video</span> Interview Setup
      </h1>

      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center space-x-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                steps === step
                  ? "bg-[#E7ECFF] text-[#3B64F6] border-[#3B64F6]"
                  : steps > step
                  ? "bg-[#3B64F6] text-white border-[#3B64F6]"
                  : "border-[#E2E8F0] text-gray-400"
              }`}
              onClick={() => {
                if (steps > step) setSteps(step);
              }}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`h-0.5 w-12 ${
                  steps > step ? "bg-[#3B64F6]" : "bg-[#E2E8F0]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="w-md z-10">
        <CardHeader>
          <CardTitle className="text-base text-[#4F637E] text-center font-normal">
            {steps === 1 &&
              "Tell us where you're aiming and what role you're targeting."}
            {steps === 2 &&
              "What kind of interview would you like to simulate?"}
            {steps === 3 && "How should we generate your interview questions?"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {steps === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <Label
                  htmlFor="companyName"
                  className="text-base text-black capitalize flex justify-between"
                >
                  Company Name
                  {formData.companyName.trim() && (
                    <RemainingLength
                      currentLength={formData.companyName.length}
                      maxLength={maxCompanyNameLength}
                      message="Company name should be 3-30 char long."
                    />
                  )}
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  ref={inputRef}
                  placeholder="eg. TruScholar"
                  value={formData.companyName}
                  onChange={handleChange}
                  minLength={3}
                  maxLength={maxCompanyNameLength}
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
                  ref={jobRoleRef}
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
                disabled={formData.companyName.length < 3 || !formData.jobRole}
              >
                Next
              </Button>
            </div>
          )}

          {steps === 2 && (
            <div className="flex flex-col gap-4">
              <div>
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
                <div>
                  <Label
                    htmlFor="domain"
                    className="text-base text-black capitalize"
                  >
                    Select Domain
                  </Label>
                  <Input
                    id="domain"
                    name="domain"
                    ref={inputRef}
                    placeholder="e.g., Frontend Development, Machine Learning"
                    value={formData.domain}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <Button
                onClick={() => setSteps(3)}
                className="text-base font-bold cursor-pointer"
                disabled={
                  !formData.interviewCategory ||
                  (isDomainSpecific && !formData.domain)
                }
              >
                Next
              </Button>
            </div>
          )}

          {steps === 3 && (
            <div className="flex flex-col gap-2">
              <RadioGroup
                value={formData.inputType}
                onValueChange={(value) =>
                  handleSelectChange("inputType", value)
                }
                className="flex gap-6"
              >
                <div className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="skills-based" id="skills-based" />
                  <Label
                    htmlFor="skills-based"
                    className="cursor-pointer text-base text-black capitalize"
                  >
                    Skills-Based
                  </Label>
                </div>

                <div className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem
                    value="job-description"
                    id="job-description"
                  />
                  <Label
                    htmlFor="job-description"
                    className="cursor-pointer text-base text-black capitalize"
                  >
                    Job Description-Based
                  </Label>
                </div>
              </RadioGroup>

              {formData.inputType === "skills-based" ? (
                <div className="space-y-0 relative">
                  <p className="text-xs flex justify-between h-4 ml-1">
                    (Type and Enter a skill. Enter maximum 5 skills.)
                    {skill && (
                      <RemainingLength
                        currentLength={skill.length}
                        maxLength={maxSkillLength}
                        message="Skills length should be 2 - 20 letters."
                      />
                    )}
                  </p>
                  <Input
                    placeholder="Type a skill and press Enter"
                    ref={inputRef}
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    minLength={2}
                    maxLength={maxSkillLength}
                    onKeyDown={handleKeyDown}
                    disabled={formData.skills.length >= maxNoOfSkills}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.map((skill) => (
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
                <div className="relative">
                  {formData.jobDescription.trim() && (
                    <RemainingLength
                      currentLength={formData.jobDescription.length}
                      maxLength={maxJDLength}
                      message="JD Should be under 99 - 999 letters."
                      position="absolute right-0 -top-6"
                    />
                  )}
                  <Textarea
                    ref={textareaRef}
                    name="jobDescription"
                    placeholder="Paste the job description here..."
                    value={formData.jobDescription}
                    onChange={handleChange}
                    minLength={minJDLength}
                    maxLength={maxJDLength}
                    className="min-h-[150px] px-3 py-2"
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
                    formData.jobDescription.length < minJDLength) ||
                  loading
                }
              >
                {loading ? (
                  "Starting Interview..."
                ) : (
                  <p>
                    Start Interview{" "}
                    <span className="text-xs font-normal">(Shift + Enter)</span>
                  </p>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const RemainingLength = ({
  currentLength,
  maxLength,
  message,
  position = "text-xs sm:text-sm font-normal flex gap-1 items-center",
}: {
  currentLength: number;
  maxLength: number;
  message: string;
  position?: string;
}) => (
  <span className={position}>
    {maxLength - currentLength}
    <Tooltip>
      <TooltipTrigger className="h-3 w-3 text-xs bg-[#3B64F6] text-white rounded-full font-bold cursor-pointer">
        i
      </TooltipTrigger>
      <TooltipContent>
        <ReactMarkdown>{message}</ReactMarkdown>
      </TooltipContent>
    </Tooltip>
  </span>
);
