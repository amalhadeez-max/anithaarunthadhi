"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { addressSchema, type AddressInput } from "@/lib/validations";
import { saveAddress } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type AddressRow = AddressInput & { id: string };

export function AddressFormDialog({
  address,
  defaults,
  onSaved,
}: {
  address?: AddressRow;
  defaults?: Partial<AddressInput>;
  onSaved?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ?? {
      label: "Home",
      fullName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
      ...defaults,
    },
  });
  const { register, handleSubmit, formState, control } = form;
  async function onSubmit(values: AddressInput) {
    const res = await saveAddress({ ...values, id: address?.id });
    if (res.ok) {
      toast.success(res.message);
      setOpen(false);
      onSaved?.(res.data!.id);
      router.refresh();
    } else toast.error(res.error);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {address ? (
          <Button variant="ghost" size="sm">
            <Pencil /> Edit
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus /> Add new address
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{address ? "Edit address" : "Add delivery address"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2" noValidate>
          <FormField label="Full name" htmlFor="a-name" error={formState.errors.fullName?.message} required>
            <Input id="a-name" autoComplete="name" {...register("fullName")} />
          </FormField>
          <FormField label="Phone" htmlFor="a-phone" error={formState.errors.phone?.message} required>
            <Input id="a-phone" type="tel" inputMode="numeric" autoComplete="tel" {...register("phone")} />
          </FormField>
          <FormField
            label="Address line 1"
            htmlFor="a-l1"
            error={formState.errors.line1?.message}
            required
            className="sm:col-span-2"
          >
            <Input
              id="a-l1"
              autoComplete="address-line1"
              placeholder="House no., street, area"
              {...register("line1")}
            />
          </FormField>
          <FormField
            label="Address line 2"
            htmlFor="a-l2"
            error={formState.errors.line2?.message}
            className="sm:col-span-2"
          >
            <Input
              id="a-l2"
              autoComplete="address-line2"
              placeholder="Landmark (optional)"
              {...register("line2")}
            />
          </FormField>
          <FormField label="City" htmlFor="a-city" error={formState.errors.city?.message} required>
            <Input id="a-city" autoComplete="address-level2" {...register("city")} />
          </FormField>
          <FormField label="State" htmlFor="a-state" error={formState.errors.state?.message} required>
            <Input id="a-state" autoComplete="address-level1" {...register("state")} />
          </FormField>
          <FormField label="Pincode" htmlFor="a-pin" error={formState.errors.pincode?.message} required>
            <Input id="a-pin" inputMode="numeric" autoComplete="postal-code" {...register("pincode")} />
          </FormField>
          <FormField label="Label" htmlFor="a-label" error={formState.errors.label?.message}>
            <Input id="a-label" placeholder="Home / Office" {...register("label")} />
          </FormField>
          <Controller
            control={control}
            name="isDefault"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(Boolean(c))} /> Make
                this my default address
              </label>
            )}
          />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formState.isSubmitting}>
              Save address
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
