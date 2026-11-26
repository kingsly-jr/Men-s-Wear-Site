"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Settings } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { storeSettingsSchema } from "@/lib/validations/admin.schema";
import { changePasswordSchema } from "@/lib/validations/auth.schema";
import type { StoreSettingsDTO } from "@/services/settings.service";

type SettingsValues = z.infer<typeof storeSettingsSchema>;
type PasswordValues = z.infer<typeof changePasswordSchema>;

export function SettingsManager({
  initialSettings,
}: {
  initialSettings: StoreSettingsDTO;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const settingsForm = useForm<SettingsValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      brandName: initialSettings.brandName,
      contactEmail: initialSettings.contactEmail,
      contactPhone: initialSettings.contactPhone,
      storeAddress: initialSettings.storeAddress,
      currencyCode: initialSettings.currencyCode,
      currencySymbol: initialSettings.currencySymbol,
      taxRatePercent: initialSettings.taxRatePercent,
      freeShippingThreshold: initialSettings.freeShippingThreshold,
      defaultShippingFee: initialSettings.defaultShippingFee,
      defaultLowStockThreshold: initialSettings.defaultLowStockThreshold,
      returnWindowDays: initialSettings.returnWindowDays,
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSaveSettings = async (values: SettingsValues) => {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Save failed",
        description: data?.error?.message ?? "Check settings fields.",
        variant: "error",
      });
      return;
    }
    toast({ title: "Store settings saved", variant: "success" });
    router.refresh();
  };

  const onChangePassword = async (values: PasswordValues) => {
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Password error",
        description: data?.error?.message ?? "Incorrect current password.",
        variant: "error",
      });
      return;
    }
    passwordForm.reset();
    toast({ title: "Admin password updated", variant: "success" });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
          Store &amp; Administrator Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Configure global brand metadata, currency, tax rate, shipping rules,
          inventory alerts, and return policy.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span>Global Store Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={settingsForm.handleSubmit(onSaveSettings)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <Label htmlFor="st-brand">Brand Name</Label>
              <Input
                id="st-brand"
                className="mt-1"
                {...settingsForm.register("brandName")}
              />
            </div>

            <div>
              <Label htmlFor="st-email">Contact Email</Label>
              <Input
                id="st-email"
                type="email"
                className="mt-1"
                {...settingsForm.register("contactEmail")}
              />
            </div>

            <div>
              <Label htmlFor="st-phone">Contact Phone</Label>
              <Input
                id="st-phone"
                className="mt-1"
                {...settingsForm.register("contactPhone")}
              />
            </div>

            <div>
              <Label htmlFor="st-addr">Store Address</Label>
              <Input
                id="st-addr"
                className="mt-1"
                {...settingsForm.register("storeAddress")}
              />
            </div>

            <div>
              <Label htmlFor="st-curr">Currency Code (ISO)</Label>
              <Input
                id="st-curr"
                className="mt-1 font-mono uppercase"
                {...settingsForm.register("currencyCode")}
              />
            </div>

            <div>
              <Label htmlFor="st-sym">Currency Symbol</Label>
              <Input
                id="st-sym"
                className="mt-1 font-mono"
                {...settingsForm.register("currencySymbol")}
              />
            </div>

            <div>
              <Label htmlFor="st-tax">Tax Rate (%)</Label>
              <Input
                id="st-tax"
                type="number"
                step="0.01"
                className="mt-1"
                {...settingsForm.register("taxRatePercent", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div>
              <Label htmlFor="st-free">Free Shipping Threshold</Label>
              <Input
                id="st-free"
                type="number"
                step="0.01"
                className="mt-1"
                {...settingsForm.register("freeShippingThreshold", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div>
              <Label htmlFor="st-ship">Default Shipping Fee</Label>
              <Input
                id="st-ship"
                type="number"
                step="0.01"
                className="mt-1"
                {...settingsForm.register("defaultShippingFee", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div>
              <Label htmlFor="st-low">Default Low Stock Threshold</Label>
              <Input
                id="st-low"
                type="number"
                className="mt-1"
                {...settingsForm.register("defaultLowStockThreshold", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div>
              <Label htmlFor="st-ret">Return Window (Days)</Label>
              <Input
                id="st-ret"
                type="number"
                className="mt-1"
                {...settingsForm.register("returnWindowDays", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="flex items-end sm:col-span-2">
              <Button
                type="submit"
                isLoading={settingsForm.formState.isSubmitting}
              >
                <Save className="h-4 w-4" strokeWidth={1.75} />
                <span>Save Store Settings</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Administrator Password Security</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(onChangePassword)}
            className="flex max-w-md flex-col gap-4"
          >
            <div>
              <Label htmlFor="adm-cur-pw">Current Password</Label>
              <Input
                id="adm-cur-pw"
                type="password"
                className="mt-1"
                {...passwordForm.register("currentPassword")}
              />
            </div>
            <div>
              <Label htmlFor="adm-new-pw">New Password</Label>
              <Input
                id="adm-new-pw"
                type="password"
                className="mt-1"
                {...passwordForm.register("newPassword")}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              isLoading={passwordForm.formState.isSubmitting}
            >
              Update Admin Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
