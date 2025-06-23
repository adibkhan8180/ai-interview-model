import { FormState, InterviewSetupData } from "@/types";
import { create } from "zustand";

const defaultFormData: InterviewSetupData = {
  companyName: "",
  jobRole: "",
  interviewCategory: "general",
  domain: "",
  jobDescription: "",
};

export const useFormStore = create<FormState>((set) => ({
  formData: defaultFormData,

  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  resetForm: () =>
    set(() => ({
      formData: defaultFormData,
    })),
}));
