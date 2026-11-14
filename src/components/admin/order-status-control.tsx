"use client";

import { useState, useTransition } from "react";
import { ORDER_STATUSES, type OrderStatus } from "@/data/types";
import { setOrderStatusAction } from "@/server/actions/admin";
import { Select } from "@/components/ui/select";

export function OrderStatusControl({ id, status }: { id: string; status: OrderStatus }) {
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();
  const changed = value !== status;
  return (
    <div className="space-y-3">
      <Select
        label="Order status"
        value={value}
        options={ORDER_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))}
        onChange={setValue}
      />
      {value === "cancelled" && status !== "cancelled" && <p className="text-xs text-warning">Cancelling returns the items to stock.</p>}
      <button type="button" disabled={!changed || pending} onClick={() => start(() => setOrderStatusAction(id, value))} className="btn-primary w-full">
        {pending ? "Updating..." : "Update status"}
      </button>
    </div>
  );
}
