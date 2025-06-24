import { FormState, InterviewSetupData } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const defaultFormData: InterviewSetupData = {
  companyName: "",
  jobRole: "",
  interviewCategory: "general",
  domain: "",
  jobDescription: "",
};

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      formData: defaultFormData,

      setFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),

      resetForm: () =>
        set(() => ({
          formData: defaultFormData,
        })),
    }),
    {
      name: "form-storage", // key name in localStorage
    }
  )
);
