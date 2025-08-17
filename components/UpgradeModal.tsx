"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Lock, Zap } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export const UpgradeModal = ({
  isOpen,
  onClose,
  featureName,
}: UpgradeModalProps) => {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/pricing");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Lock className="w-8 h-8 text-primary" />{" "}
        
          </div>
        </div>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Upgrade Required
          </DialogTitle>
          <DialogDescription className="mt-2">
            {featureName ? (
              <>
                <span className="font-medium">{featureName}</span> is only
                available for Pro users.
              </>
            ) : (
              "Your current plan doesn't include this. Upgrade to continue."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Not Now
          </Button>
          <Button onClick={handleUpgrade} className="gap-1">
            <Zap className="w-4 h-4" />
            Upgrade Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
