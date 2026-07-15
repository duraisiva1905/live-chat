"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LeaveConfirmDialogProps {
  open: boolean;
  room: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function LeaveConfirmDialog({
  open,
  room,
  onOpenChange,
  onConfirm,
}: LeaveConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Leave room?</DialogTitle>
          <DialogDescription>
            You will leave <span className="font-medium text-foreground">#{room}</span>{" "}
            and stop receiving messages from this room until you join again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            Leave room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
