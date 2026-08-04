import { useSyncExternalStore } from "react";

export type ReorderRecord = { orderId: string; newId: string; placedAt: string };

let records: Record<string, ReorderRecord> = {};
const listeners = new Set<() => void>();
let counter = 0;

function emit() {
  records = { ...records };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return records;
}

const emptySnapshot: Record<string, ReorderRecord> = {};

export function useReorders() {
  return useSyncExternalStore(subscribe, getSnapshot, () => emptySnapshot);
}

export function placeReorder(orderId: string): ReorderRecord {
  const existing = records[orderId];
  if (existing) return existing;

  counter += 1;
  const record: ReorderRecord = {
    orderId,
    newId: `ORD-${25000 + counter}`,
    placedAt: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
  records[orderId] = record;
  emit();
  return record;
}
