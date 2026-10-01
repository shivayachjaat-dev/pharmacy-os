import prisma from "@/lib/prisma";
import { FileCheck, ShieldAlert, CheckCircle2, XCircle, Clock, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PharmacistReviewAction } from "./review-action";

export default async function PrescriptionsQueuePage() {
  const prescriptions = await prisma.prescription.findMany({
    include: {
      customer: true,
      onlineOrder: {
        include: {
          items: {
            include: { product: true },
          },
        },
      },
      reviewedBy: true,
    },
    orderBy: { uploadedAt: "desc" },
  });

  const pendingList = prescriptions.filter((p) => p.status === "PENDING_REVIEW");
  const reviewedList = prescriptions.filter((p) => p.status !== "PENDING_REVIEW");

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            Pharmacist Prescription Verification Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Statutory review gate under Drugs and Cosmetics Act, 1940 and Pharmacy Act, 1948.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            Duty Pharmacist: Priya Nair (PCI-DL-48291-R)
          </span>
        </div>
      </div>

      {/* Pending Prescriptions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Pending Clinical Review ({pendingList.length})
          </h2>
          <span className="text-xs text-slate-500">Requires licensed pharmacist verification</span>
        </div>

        {pendingList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto stroke-1 mb-2 text-emerald-500" />
            <p className="text-sm font-medium">All prescriptions reviewed!</p>
            <p className="text-xs mt-0.5">The queue is clean. New uploaded prescriptions will appear here in real time.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingList.map((rx) => (
              <div key={rx.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {rx.onlineOrder?.orderNumber || "Direct Upload"}
                    </span>
                    <span className="text-xs text-slate-500">
                      Uploaded {formatDate(rx.uploadedAt)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-800">
                    <span className="font-semibold text-slate-600">Patient:</span> {rx.patientName || rx.customer.name} (Phone: {rx.customer.phone})
                  </div>
                  {rx.doctorName && (
                    <div className="text-xs text-amber-800 font-medium">
                      Doctor on Rx: {rx.doctorName}
                    </div>
                  )}

                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">Prescribed Drugs:</span>{" "}
                    {rx.onlineOrder?.items.map((i) => i.product.name).join(", ") || "Awaiting item assignment"}
                  </div>

                  <div className="text-[11px] font-mono text-blue-600 underline">
                    Attached Document: {rx.fileName}
                  </div>
                </div>

                {/* Approve / Reject Actions Component */}
                <PharmacistReviewAction prescriptionId={rx.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Reviews */}
      {reviewedList.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900 text-sm">
              Recent Pharmacist Audit History
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Reviewed By</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3">Clinical Notes</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviewedList.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{rx.onlineOrder?.orderNumber}</td>
                    <td className="p-3 font-medium text-slate-800">{rx.patientName || rx.customer.name}</td>
                    <td className="p-3 text-slate-600">{rx.doctorName || "N/A"}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{rx.reviewedBy?.name || "Priya Nair"}</div>
                      <div className="text-[10px] text-slate-500">{rx.reviewedBy?.pharmacistRegNo || "PCI-DL-48291-R"}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rx.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rx.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{rx.reviewNotes || "Verified with prescription"}</td>
                    <td className="p-3 text-slate-500">{rx.reviewedAt ? formatDate(rx.reviewedAt) : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
