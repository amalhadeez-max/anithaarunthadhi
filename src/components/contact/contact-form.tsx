"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { contactSchema, type ContactInput } from "@/lib/validations";
import { submitContact } from "@/actions/messages";
import { CONTACT_SUBJECTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

function Underline({
  id,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-neutral-500">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "mt-1 w-full border-0 border-b bg-transparent px-0 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-0",
          error ? "border-destructive" : "border-neutral-300",
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm() {
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subject: "general_inquiry",
      message: "",
    },
  });
  const { register, handleSubmit, formState, control, reset } = form;
  const e = formState.errors;

  async function onSubmit(values: ContactInput) {
    const res = await submitContact(values);
    if (res.ok) {
      toast.success(res.message ?? "Message sent");
      reset();
    } else toast.error(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col gap-7" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <Underline
          id="firstName"
          label="First Name"
          placeholder="John"
          autoComplete="given-name"
          error={e.firstName?.message}
          {...register("firstName")}
        />
        <Underline
          id="lastName"
          label="Last Name"
          placeholder="Doe"
          autoComplete="family-name"
          error={e.lastName?.message}
          {...register("lastName")}
        />
        <Underline
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={e.email?.message}
          {...register("email")}
        />
        <Underline
          id="phone"
          label="Phone Number"
          type="tel"
          inputMode="numeric"
          placeholder="+91 98400 00000"
          autoComplete="tel"
          error={e.phone?.message}
          {...register("phone")}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-neutral-900">Select Subject?</legend>
        <Controller
          control={control}
          name="subject"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-3 flex flex-wrap gap-x-6 gap-y-3"
            >
              {CONTACT_SUBJECTS.map((s) => (
                <label
                  key={s.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700"
                >
                  <RadioGroupItem value={s.value} className="h-4 w-4 border-neutral-900 text-neutral-900" />{" "}
                  {s.label}
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </fieldset>

      <div>
        <label htmlFor="message" className="block text-xs font-medium text-neutral-500">
          Message
        </label>
        <textarea
          id="message"
          rows={3}
          placeholder="Write your message.."
          className={cn(
            "mt-1 w-full resize-none border-0 border-b bg-transparent px-0 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-0",
            e.message ? "border-destructive" : "border-neutral-300",
          )}
          aria-invalid={Boolean(e.message)}
          {...register("message")}
        />
        {e.message && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {e.message.message}
          </p>
        )}
      </div>

      <div className="mt-auto flex justify-end">
        <Button
          type="submit"
          size="lg"
          className="h-12 rounded-md bg-neutral-950 px-8 shadow-lg shadow-neutral-900/20 hover:bg-neutral-800"
          loading={formState.isSubmitting}
        >
          {!formState.isSubmitting && <Send />} Send Message
        </Button>
      </div>
    </form>
  );
}
