"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2, Phone } from "lucide-react";
import type { ContactSubject } from "@prisma/client";
import { setMessageRead, deleteMessage } from "@/actions/messages";
import { CONTACT_SUBJECTS } from "@/lib/constants";
import { formatDateTime, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "./confirm-button";

export type MessageRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  subject: ContactSubject;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export function MessagesInbox({ rows }: { rows: MessageRow[] }) {
  const router = useRouter();
  return (
    <ul className="space-y-2">
      {rows.map((m) => (
        <li
          key={m.id}
          className={cn(
            "rounded-xl border p-4",
            m.isRead ? "bg-white" : "border-l-4 border-l-brand bg-white",
          )}
        >
          <div className="flex flex-wrap items-start gap-3">
            <button
              type="button"
              className="mt-0.5 text-neutral-500"
              aria-label={m.isRead ? "Mark unread" : "Mark read"}
              onClick={async () => {
                const r = await setMessageRead(m.id, !m.isRead);
                if (r.ok) router.refresh();
                else toast.error(r.error);
              }}
            >
              {m.isRead ? <MailOpen className="h-5 w-5" /> : <Mail className="h-5 w-5 text-brand" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={cn("font-semibold", !m.isRead && "text-neutral-900")}>
                  {m.firstName} {m.lastName}
                </span>
                <a href={`mailto:${m.email}`} className="text-muted-foreground hover:underline">
                  {m.email}
                </a>
                {m.phone && (
                  <a
                    href={`tel:${m.phone}`}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {m.phone}
                  </a>
                )}
                <Badge variant="secondary">
                  {CONTACT_SUBJECTS.find((s) => s.value === m.subject)?.label}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{m.message}</p>
            </div>
            <div className="flex gap-1">
              <Button asChild size="sm" variant="outline">
                <a href={`mailto:${m.email}?subject=Re: your message to us`}>Reply</a>
              </Button>
              <ConfirmButton
                size="icon-sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                aria-label="Delete"
                title="Delete this message?"
                confirmLabel="Delete"
                action={() => deleteMessage(m.id)}
              >
                <Trash2 />
              </ConfirmButton>
            </div>
          </div>
        </li>
      ))}
      {rows.length === 0 && (
        <li className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Inbox is empty.
        </li>
      )}
    </ul>
  );
}
