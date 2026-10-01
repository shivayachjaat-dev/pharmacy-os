"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function PharmacistReviewAction({ prescriptionId }: { prescriptionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReview = async (decision: "APPROVED" | "REJECTED") => {
    setLoading(true);
    try {
      const res = await fetch("/api/prescriptions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prescriptionId,
          decision,
          reviewNotes: decision === "APPROVED" ? "Medications, strength, and doctor signature verified" : "Prescription incomplete or expired",
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert("Failed to review: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={loading}
        onClick={() => handleReview("APPROVED")}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Approve & Sign Off
      </button>
      <button
        disabled={loading}
        onClick={() => handleReview("REJECTED")}
        className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
      >
        <XCircle className="w-3.5 h-3.5" />
        Reject
      </button>
    </div>
  );
}
