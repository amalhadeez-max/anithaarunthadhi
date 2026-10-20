"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Profile } from "@prisma/client";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { ImageUploader } from "@/components/shared/image-uploader";

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
      avatarUrl: profile.avatarUrl ?? "",
      addressLine1: profile.addressLine1 ?? "",
      addressLine2: profile.addressLine2 ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
      pincode: profile.pincode ?? "",
    },
  });
  const { register, handleSubmit, formState, watch, setValue } = form;
  const avatarUrl = watch("avatarUrl");

  async function onSubmit(values: ProfileInput) {
    const res = await updateProfile(values);
    if (res.ok) {
      toast.success(res.message ?? "Saved");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatarUrl || undefined} alt="" />
          <AvatarFallback className="text-lg">
            {initials(profile.fullName, profile.email[0]?.toUpperCase())}
          </AvatarFallback>
        </Avatar>
        <ImageUploader
          folder="avatars"
          value={avatarUrl ? [avatarUrl] : []}
          onChange={(urls) => setValue("avatarUrl", urls[0] ?? "", { shouldDirty: true })}
          max={1}
          compact
          label="Change photo"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="fullName" error={formState.errors.fullName?.message} required>
          <Input id="fullName" autoComplete="name" {...register("fullName")} />
        </FormField>
        <FormField label="Email" htmlFor="email" hint="Email can't be changed">
          <Input id="email" value={profile.email} disabled readOnly aria-readonly />
        </FormField>
        <FormField label="Phone" htmlFor="phone" error={formState.errors.phone?.message}>
          <Input id="phone" type="tel" inputMode="numeric" autoComplete="tel" {...register("phone")} />
        </FormField>
        <FormField
          label="Address line 1"
          htmlFor="addressLine1"
          error={formState.errors.addressLine1?.message}
          className="sm:col-span-2"
        >
          <Input id="addressLine1" autoComplete="address-line1" {...register("addressLine1")} />
        </FormField>
        <FormField
          label="Address line 2"
          htmlFor="addressLine2"
          error={formState.errors.addressLine2?.message}
          className="sm:col-span-2"
        >
          <Input id="addressLine2" autoComplete="address-line2" {...register("addressLine2")} />
        </FormField>
        <FormField label="City" htmlFor="city" error={formState.errors.city?.message}>
          <Input id="city" autoComplete="address-level2" {...register("city")} />
        </FormField>
        <FormField label="State" htmlFor="state" error={formState.errors.state?.message}>
          <Input id="state" autoComplete="address-level1" {...register("state")} />
        </FormField>
        <FormField label="Pincode" htmlFor="pincode" error={formState.errors.pincode?.message}>
          <Input id="pincode" inputMode="numeric" autoComplete="postal-code" {...register("pincode")} />
        </FormField>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={formState.isSubmitting} disabled={!formState.isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
