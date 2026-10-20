"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/types";

/** Button that opens a confirmation dialog and then runs a server action. */
export function ConfirmButton({
  title,
  description,
  confirmLabel = "Confirm",
  action,
  children,
  onDone,
  ...btn
}: ButtonProps & {
  title: string;
  description?: string;
  confirmLabel?: string;
  action: () => Promise<ActionResult<unknown>>;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button type="button" {...btn} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant={btn.variant === "destructive" ? "destructive" : "default"}
              loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await action();
                  if (res.ok) {
                    toast.success(res.message ?? "Done");
                    setOpen(false);
                    onDone?.();
                    router.refresh();
                  } else toast.error(res.error);
                })
              }
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
