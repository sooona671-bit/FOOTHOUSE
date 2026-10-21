import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fhButton } from "./primitives";

export function SignInPrompt({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();

  const goToAuth = (to: "/auth/sign-in" | "/auth/sign-up") => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl border-border bg-background p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-foreground">Sign in to continue</DialogTitle>
          <DialogDescription className="pt-2 text-center text-sm leading-6 text-muted-foreground">
            Create an account or sign in to save your bag and favourites.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 gap-2 sm:flex-col sm:space-x-0">
          <button type="button" className={fhButton()} onClick={() => goToAuth("/auth/sign-in")}>Sign in</button>
          <button type="button" className={fhButton({ variant: "outline" })} onClick={() => goToAuth("/auth/sign-up")}>Create account</button>
          <DialogClose
            className="mt-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Not now
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
