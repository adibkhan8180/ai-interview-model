import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFormStore } from "@/lib/store/formStore";
import { useInterviewStore } from "@/lib/store/interviewStore";
import { useRouter } from "next/navigation";

interface Props {
  openDialogue: boolean;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ConfirmDialog({ openDialogue, setOpenDialog }: Props) {
  const router = useRouter();
  const { resetForm: resetInterviewSetup } = useFormStore();
  const { resetStore: resetInterviewStore } = useInterviewStore();

  const startNewInterview = async () => {
    resetInterviewStore();
    resetInterviewSetup();
    router.replace("/");
  };
  return (
    <AlertDialog open={openDialogue} onOpenChange={() => setOpenDialog(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Your interview session isn’t finished yet. Leaving now will erase
            your progress. Are you sure you want to go back?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={startNewInterview}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
