"use client";

import { useState, useEffect } from "react";
import {
  subscribeToDamageReports,
  markAsDispatched,
} from "@/lib/controllers/dashboardController";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState(null);
  const [dispatchingId, setDispatchingId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToDamageReports((data) => {
      setReports(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getEffectiveStatus = (report) => {
    if (report.status?.toLowerCase().includes("pending")) return "Pending Audit";
    if (report.status?.toLowerCase().includes("approved")) return "Approved";
    return report.incidentLoss >= 10000 ? "Pending Audit" : "Approved";
  };

  const filteredReports =
    filter === "pending"
      ? reports.filter((r) => getEffectiveStatus(r) === "Pending Audit")
      : reports;

  const handleDispatch = async (docId) => {
    setDispatchingId(docId);
    await markAsDispatched(docId);
    setDispatchingId(null);
  };

  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);

  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatCurrency = (value) => (value || 0).toLocaleString("en-US");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-64 animate-pulse rounded-xl bg-white/5" />
        <div className="h-96 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#111111]">
      <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-white">Warehouse Reports</h2>
        <div className="flex rounded-lg bg-white/5 p-1">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
              filter === "all" ? "bg-cyan-500 text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            View All Reports
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
              filter === "pending" ? "bg-amber-500 text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Action Required (Pending)
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Zone</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Total Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-gray-500">No damage reports found.</td>
              </tr>
            ) : (
              filteredReports.map((report, index) => {
                const effectiveStatus = getEffectiveStatus(report);
                const isApproved = effectiveStatus === "Approved";
                const isExpanded = expandedRow === report.id;
                const isDispatching = dispatchingId === report.id;

                return (
                  <TableRow
                    key={report.id}
                    report={report}
                    index={index}
                    isApproved={isApproved}
                    isExpanded={isExpanded}
                    isDispatching={isDispatching}
                    onToggle={() => toggleRow(report.id)}
                    onDispatch={() => handleDispatch(report.id)}
                    formatTime={formatTime}
                    formatCurrency={formatCurrency}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableRow({ report, index, isApproved, isExpanded, isDispatching, onToggle, onDispatch, formatTime, formatCurrency }) {
  return (
    <>
      <tr onClick={onToggle} className={`cursor-pointer transition-colors hover:bg-white/5 ${isExpanded ? "bg-white/5" : ""}`}>
        <td className="px-6 py-4 text-gray-400">{index + 1}.</td>
        <td className="px-6 py-4 text-gray-300">{formatTime(report.timestamp)}</td>
        <td className="px-6 py-4 text-gray-300">{report.sku || "—"}</td>
        <td className="px-6 py-4 font-medium text-white">{report.productName || "—"}</td>
        <td className="px-6 py-4 text-gray-300">{report.warehouseZone || "—"}</td>
        <td className="max-w-[200px] truncate px-6 py-4">
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-400">{report.description || "—"}</span>
        </td>
        <td className="px-6 py-4">
          {isApproved ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">✓ Approved</span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">● Pending Audit</span>
          )}
        </td>
        <td className="px-6 py-4 text-right font-medium text-white">{formatCurrency(report.incidentLoss)} LKR</td>
      </tr>

      <tr>
        <td colSpan={8} className="p-0">
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="border-l-4 border-cyan-500 bg-white/5 px-8 py-6 backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">📷 Evidence Image</p>
                    {report.imageUrl ? (
                      <img src={report.imageUrl} alt={`Evidence for ${report.productName}`} className="h-40 w-full rounded-lg object-cover ring-1 ring-white/10" />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg bg-gray-700 ring-1 ring-white/10">
                        <p className="text-sm text-gray-500">No Image Provided</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">🔊 Audio Evidence</p>
                    {report.audioUrl ? (
                      <audio controls src={report.audioUrl} className="w-full" preload="none" />
                    ) : (
                      <p className="text-sm italic text-gray-600">No Audio Recorded</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-xs text-gray-500">Product</p>
                      <p className="font-semibold text-white">{report.productName || "—"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white/5 p-4">
                        <p className="text-xs text-gray-500">Zone</p>
                        <p className="font-semibold text-white">{report.warehouseZone || "—"}</p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-4">
                        <p className="text-xs text-gray-500">Loss</p>
                        <p className="font-semibold text-emerald-400">{formatCurrency(report.incidentLoss)} LKR</p>
                      </div>
                    </div>
                  </div>
                  {!isApproved && (
                    <div className="mt-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); onDispatch(); }}
                        disabled={isDispatching}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:shadow-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDispatching ? "Updating..." : "🚀 Mark as Dispatched"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
