"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function GoalSheetSubmitButton({ sheetId }: { sheetId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals/${sheetId}/submit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Submit failed"); return; }
      toast.success("Goal sheet submitted for approval");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="btn-primary" style={{ fontSize: "12px", padding: "7px 16px" }} disabled={loading} onClick={submit}>
      {loading ? "Submitting…" : "Submit for approval"}
    </button>
  );
}
