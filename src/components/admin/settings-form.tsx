"use client";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { siteSettingsSchema, type SiteSettingsInput } from "@/lib/validations";
import { updateSiteSettings } from "@/actions/settings";
import type { SiteSettingsPlain } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/shared/image-uploader";

export function SettingsForm({ settings: s }: { settings: SiteSettingsPlain }) {
  const router = useRouter();
  const form = useForm<SiteSettingsInput>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      storeName: s.storeName,
      logoUrl: s.logoUrl ?? "",
      tagline: s.tagline,
      heroVideoUrl: s.heroVideoUrl ?? "",
      heroYoutubeUrl: s.heroYoutubeUrl ?? "",
      homeDescription: s.homeDescription,
      aboutStory: s.aboutStory,
      aboutMission: s.aboutMission,
      aboutGallery: s.aboutGallery,
      mapEmbedUrl: s.mapEmbedUrl ?? "",
      contactPhone: s.contactPhone ?? "",
      contactEmail: s.contactEmail ?? "",
      addressLine1: s.addressLine1 ?? "",
      addressLine2: s.addressLine2 ?? "",
      city: s.city ?? "",
      altContactName: s.altContactName ?? "",
      altContactPhone: s.altContactPhone ?? "",
      youtubeUrl: s.youtubeUrl ?? "",
      instagramUrl: s.instagramUrl ?? "",
      facebookUrl: s.facebookUrl ?? "",
      whatsappNumber: s.whatsappNumber,
      deliveryCharge: s.deliveryCharge,
      freeDeliveryThreshold: s.freeDeliveryThreshold,
      codEnabled: s.codEnabled,
    },
  });
  const { register, handleSubmit, formState, control } = form;
  const e = formState.errors;

  async function onSubmit(values: SiteSettingsInput) {
    const res = await updateSiteSettings(values);
    if (res.ok) {
      toast.success(res.message);
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Tabs defaultValue="brand">
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="brand">Brand & Home</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="contact">Contact & Social</TabsTrigger>
          <TabsTrigger value="commerce">Delivery & Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="brand">
          <Card>
            <CardHeader>
              <CardTitle>Brand & home page</CardTitle>
              <CardDescription>Store name is used in the title, header, emails and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField label="Store name" htmlFor="storeName" error={e.storeName?.message} required>
                <Input id="storeName" {...register("storeName")} />
              </FormField>
              <FormField label="Tagline" htmlFor="tagline" error={e.tagline?.message}>
                <Input id="tagline" {...register("tagline")} />
              </FormField>
              <FormField label="Logo (replaces the text wordmark)" className="md:col-span-2">
                <Controller
                  control={control}
                  name="logoUrl"
                  render={({ field }) => (
                    <ImageUploader
                      folder="settings"
                      value={field.value ? [field.value] : []}
                      onChange={(u) => field.onChange(u[0] ?? "")}
                      max={1}
                      label="Upload logo"
                    />
                  )}
                />
              </FormField>
              <FormField
                label="Hero video (MP4 upload)"
                hint="Vertical/short video works best. Leave empty to use the YouTube link."
                error={e.heroVideoUrl?.message as string | undefined}
              >
                <Controller
                  control={control}
                  name="heroVideoUrl"
                  render={({ field }) => (
                    <ImageUploader
                      folder="settings"
                      accept="video/mp4,video/webm"
                      value={field.value ? [field.value] : []}
                      onChange={(u) => field.onChange(u[0] ?? "")}
                      max={1}
                      label="Upload MP4"
                    />
                  )}
                />
              </FormField>
              <FormField
                label="Hero YouTube URL (fallback)"
                htmlFor="heroYoutubeUrl"
                error={e.heroYoutubeUrl?.message as string | undefined}
              >
                <Input
                  id="heroYoutubeUrl"
                  placeholder="https://youtube.com/shorts/…"
                  {...register("heroYoutubeUrl")}
                />
              </FormField>
              <FormField
                label="Home description"
                htmlFor="homeDescription"
                error={e.homeDescription?.message}
                className="md:col-span-2"
              >
                <Textarea id="homeDescription" rows={4} {...register("homeDescription")} />
              </FormField>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About page</CardTitle>
              <CardDescription>Markdown supported in story and mission.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField label="Our story" htmlFor="aboutStory" error={e.aboutStory?.message}>
                <Textarea id="aboutStory" rows={6} {...register("aboutStory")} />
              </FormField>
              <FormField label="Mission" htmlFor="aboutMission" error={e.aboutMission?.message}>
                <Textarea id="aboutMission" rows={4} {...register("aboutMission")} />
              </FormField>
              <FormField label="Photo gallery (up to 12)">
                <Controller
                  control={control}
                  name="aboutGallery"
                  render={({ field }) => (
                    <ImageUploader
                      folder="settings"
                      value={field.value}
                      onChange={field.onChange}
                      max={12}
                      label="Add photos"
                    />
                  )}
                />
              </FormField>
              <FormField
                label="Google Maps embed URL"
                htmlFor="mapEmbedUrl"
                hint='Google Maps → Share → Embed a map → copy the src="…" URL'
                error={e.mapEmbedUrl?.message as string | undefined}
              >
                <Input id="mapEmbedUrl" {...register("mapEmbedUrl")} />
              </FormField>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact details & social links</CardTitle>
              <CardDescription>Shown on the Contact page, footer and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Phone"
                htmlFor="contactPhone"
                error={e.contactPhone?.message as string | undefined}
              >
                <Input id="contactPhone" {...register("contactPhone")} />
              </FormField>
              <FormField
                label="Email"
                htmlFor="contactEmail"
                error={e.contactEmail?.message as string | undefined}
              >
                <Input id="contactEmail" type="email" {...register("contactEmail")} />
              </FormField>
              <FormField label="Address line 1" htmlFor="addressLine1">
                <Input id="addressLine1" {...register("addressLine1")} />
              </FormField>
              <FormField label="Address line 2 / area" htmlFor="addressLine2">
                <Input id="addressLine2" {...register("addressLine2")} />
              </FormField>
              <FormField label="City, state & pincode" htmlFor="city">
                <Input id="city" {...register("city")} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Alternate contact name" htmlFor="altContactName">
                  <Input id="altContactName" {...register("altContactName")} />
                </FormField>
                <FormField label="Alternate phone" htmlFor="altContactPhone">
                  <Input id="altContactPhone" {...register("altContactPhone")} />
                </FormField>
              </div>
              <FormField
                label="WhatsApp number"
                htmlFor="whatsappNumber"
                hint="Digits only with country code, e.g. 918608612481"
                error={e.whatsappNumber?.message}
                required
              >
                <Input id="whatsappNumber" inputMode="numeric" {...register("whatsappNumber")} />
              </FormField>
              <FormField
                label="YouTube URL"
                htmlFor="youtubeUrl"
                error={e.youtubeUrl?.message as string | undefined}
              >
                <Input id="youtubeUrl" {...register("youtubeUrl")} />
              </FormField>
              <FormField
                label="Instagram URL"
                htmlFor="instagramUrl"
                error={e.instagramUrl?.message as string | undefined}
              >
                <Input id="instagramUrl" {...register("instagramUrl")} />
              </FormField>
              <FormField
                label="Facebook URL"
                htmlFor="facebookUrl"
                error={e.facebookUrl?.message as string | undefined}
              >
                <Input id="facebookUrl" {...register("facebookUrl")} />
              </FormField>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commerce">
          <Card>
            <CardHeader>
              <CardTitle>Delivery & payments</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Delivery charge (₹)"
                htmlFor="deliveryCharge"
                error={e.deliveryCharge?.message}
              >
                <Input id="deliveryCharge" type="number" min={0} step="1" {...register("deliveryCharge")} />
              </FormField>
              <FormField
                label="Free delivery above (₹)"
                htmlFor="freeDeliveryThreshold"
                error={e.freeDeliveryThreshold?.message}
              >
                <Input
                  id="freeDeliveryThreshold"
                  type="number"
                  min={0}
                  step="1"
                  {...register("freeDeliveryThreshold")}
                />
              </FormField>
              <Controller
                control={control}
                name="codEnabled"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
                    <div>
                      <div className="text-sm font-medium">Cash on Delivery</div>
                      <div className="text-xs text-muted-foreground">Allow customers to pay at the door.</div>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="COD enabled" />
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="flex justify-end">
        <Button type="submit" loading={formState.isSubmitting}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
