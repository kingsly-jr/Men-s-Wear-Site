"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { addressSchema } from "@/lib/validations/auth.schema";
import type { SavedAddressView } from "@/components/checkout/checkout-client";

type AddressInputValues = z.input<typeof addressSchema>;
type AddressOutputValues = z.output<typeof addressSchema>;

export function AccountAddressesClient({
  initialAddresses,
}: {
  initialAddresses: SavedAddressView[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [addresses, setAddresses] = React.useState(initialAddresses);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressInputValues, unknown, AddressOutputValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "India", isDefault: false },
  });

  const onCreate = async (values: AddressOutputValues) => {
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Failed to save address",
        description: data?.error?.message ?? "Please review fields.",
        variant: "error",
      });
      return;
    }

    setAddresses((prev) => {
      const cleaned = data.address.isDefault
        ? prev.map((a) => ({ ...a, isDefault: false }))
        : prev;
      return [data.address, ...cleaned];
    });
    reset({ country: "India", isDefault: false });
    toast({ title: "Address saved", variant: "success" });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/account/addresses/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Address removed", variant: "default" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved Addresses ({addresses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No saved addresses yet. Add one below for expedited checkout.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="flex flex-col justify-between border border-border bg-background p-4 text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold uppercase">
                        {addr.label || addr.fullName}
                      </span>
                      {addr.isDefault ? <Badge>Default</Badge> : null}
                    </div>
                    <p className="mt-1.5 text-foreground">
                      {addr.fullName} &middot; {addr.phone}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ""}
                      <br />
                      {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end border-t border-border pt-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      aria-label="Delete address"
                      className="inline-flex items-center gap-1 font-mono text-[11px] uppercase text-muted-foreground hover:text-primary cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span>Add New Shipping Address</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onCreate)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <Label htmlFor="addr-label">Label (e.g. Home, Studio)</Label>
              <Input id="addr-label" className="mt-1" {...register("label")} />
            </div>
            <div>
              <Label htmlFor="addr-fullName">Full Name</Label>
              <Input
                id="addr-fullName"
                className="mt-1"
                {...register("fullName")}
              />
              {errors.fullName ? (
                <p className="mt-1 text-xs text-primary">
                  {errors.fullName.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="addr-phone">Phone</Label>
              <Input id="addr-phone" className="mt-1" {...register("phone")} />
              {errors.phone ? (
                <p className="mt-1 text-xs text-primary">
                  {errors.phone.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="addr-postal">Postal / PIN Code</Label>
              <Input
                id="addr-postal"
                className="mt-1"
                {...register("postalCode")}
              />
              {errors.postalCode ? (
                <p className="mt-1 text-xs text-primary">
                  {errors.postalCode.message}
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="addr-line1">Address Line 1</Label>
              <Input id="addr-line1" className="mt-1" {...register("line1")} />
              {errors.line1 ? (
                <p className="mt-1 text-xs text-primary">
                  {errors.line1.message}
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="addr-line2">Address Line 2 (Optional)</Label>
              <Input id="addr-line2" className="mt-1" {...register("line2")} />
            </div>
            <div>
              <Label htmlFor="addr-city">City</Label>
              <Input id="addr-city" className="mt-1" {...register("city")} />
              {errors.city ? (
                <p className="mt-1 text-xs text-primary">
                  {errors.city.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="addr-state">State</Label>
              <Input id="addr-state" className="mt-1" {...register("state")} />
              {errors.state ? (
                <p className="mt-1 text-xs text-primary">
                  {errors.state.message}
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 font-mono text-xs uppercase cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  {...register("isDefault")}
                />
                <span>Set as default shipping address</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" isLoading={isSubmitting}>
                Save Address
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
