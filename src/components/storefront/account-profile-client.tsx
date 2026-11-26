"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "@/lib/validations/auth.schema";

type ProfileValues = z.infer<typeof updateProfileSchema>;
type PasswordValues = z.infer<typeof changePasswordSchema>;

export function AccountProfileClient({
  initialName,
  initialPhone,
  email,
}: {
  initialName: string;
  initialPhone: string;
  email: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: initialName, phone: initialPhone },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onProfileSubmit = async (values: ProfileValues) => {
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Update failed",
        description: data?.error?.message ?? "Could not update profile.",
        variant: "error",
      });
      return;
    }
    toast({ title: "Profile updated", variant: "success" });
    router.refresh();
  };

  const onPasswordSubmit = async (values: PasswordValues) => {
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Password update failed",
        description: data?.error?.message ?? "Check your current password.",
        variant: "error",
      });
      return;
    }
    passwordForm.reset();
    toast({ title: "Password changed", variant: "success" });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <Label htmlFor="prof-name">Full Name</Label>
              <Input
                id="prof-name"
                className="mt-1.5"
                {...profileForm.register("name")}
              />
              {profileForm.formState.errors.name ? (
                <p className="mt-1 text-xs text-primary">
                  {profileForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="prof-phone">Phone</Label>
              <Input
                id="prof-phone"
                className="mt-1.5"
                {...profileForm.register("phone")}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="prof-email">Email Address</Label>
              <Input
                id="prof-email"
                value={email}
                disabled
                className="mt-1.5 opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <Button
                type="submit"
                isLoading={profileForm.formState.isSubmitting}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="flex max-w-md flex-col gap-4"
          >
            <div>
              <Label htmlFor="pw-current">Current Password</Label>
              <Input
                id="pw-current"
                type="password"
                className="mt-1.5"
                {...passwordForm.register("currentPassword")}
              />
              {passwordForm.formState.errors.currentPassword ? (
                <p className="mt-1 text-xs text-primary">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="pw-new">New Password</Label>
              <Input
                id="pw-new"
                type="password"
                className="mt-1.5"
                {...passwordForm.register("newPassword")}
              />
              {passwordForm.formState.errors.newPassword ? (
                <p className="mt-1 text-xs text-primary">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="secondary"
              isLoading={passwordForm.formState.isSubmitting}
            >
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
