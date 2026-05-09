"use client";

import { useState, useEffect } from "react";
import {
  subscribeToDamageReports,
  markAsDispatched,
  computeKPIs,
  generatePDFReport,
} from "@/lib/controllers/dashboardController";

export default function DashboardPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "pending"
  const [expandedRow, setExpandedRow] = useState(null);
  const [dispatchingId, setDispatchingId] = useState(null);

  // ── Real-time Firestore subscription ──
  useEffect(() => {
    const unsubscribe = subscribeToDamageReports((data) => {
      setReports(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Computed data ──
  const kpis = computeKPIs(reports);
  const filteredReports =
    filter === "pending"
      ? reports.filter((r) => r.status === "Pending Audit")
      : reports;

  // ── Handlers ──
  const handleDispatch = async (docId) => {
    setDispatchingId(docId);
    await markAsDispatched(docId);
    setDispatchingId(null);
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatCurrency = (value) => {
    return (value || 0).toLocaleString("en-US");
  };

  // ── Pill colors for Top 3 ──
  const pillColors = [
    "border-emerald-500 text-emerald-400",
    "border-yellow-500 text-yellow-400",
    "border-red-500 text-red-400",
  ];

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-white/5" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-36 animate-pulse rounded-xl bg-white/5" />
          <div className="h-36 animate-pulse rounded-xl bg-white/5" />
        </div>
        <div className="h-12 animate-pulse rounded-xl bg-white/5" />
        <div className="h-80 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══════════ HEADER ═══════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 ring-2 ring-gray-600">
            <svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Hello Nimal!</h1>
        </div>
        <span className="text-xl font-semibold italic text-cyan-400">
          NestTrack.
        </span>
      </div>

      {/* ═══════════ KPI WIDGETS ═══════════ */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Total Daily Loss */}
        <div className="rounded-xl border border-cyan-500/30 bg-[#0f0f23] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Total Daily Loss
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">
                {formatCurrency(kpis.totalDailyLoss)} LKR
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  +26%
                </span>
                <span className="text-xs text-gray-500">Since Last Month</span>
              </div>
            </div>
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <svg className="h-6 w-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Top 3 Damaged Items */}
        <div className="rounded-xl border border-cyan-500/30 bg-[#0f0f23] p-6">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-gray-400">
              Top 3 Damaged Items
            </p>
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <svg className="h-5 w-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {kpis.topDamagedItems.length > 0 ? (
              kpis.topDamagedItems.map((item, i) => (
                <div
                  key={item.name}
                  className={`flex flex-col items-center rounded-xl border bg-white/5 px-5 py-3 ${pillColors[i]}`}
                >
                  <span className="text-sm font-semibold text-white">
                    {item.name}
                  </span>
                  <span className="text-xs">{item.count} Units</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No data yet</p>
            )}
          </div>
          {/* Color bar */}
          <div className="mt-4 flex h-2 overflow-hidden rounded-full">
            <div className="flex-[3] bg-emerald-500" />
            <div className="flex-[2] bg-yellow-500" />
            <div className="flex-[1] bg-red-500" />
          </div>
        </div>
      </div>

      {/* ═══════════ EXPORT REPORT ═══════════ */}
      <button
        onClick={() => generatePDFReport(filteredReports)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30 md:max-w-md"
      >
        Export Report
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      </button>

      {/* ═══════════ TABLE SECTION ═══════════ */}
      <div className="rounded-xl border border-white/10 bg-[#0f0f23]">
        {/* Table Header + Filter */}
        <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-white">Warehouse Reports</h2>
          <div className="flex rounded-lg bg-white/5 p-1">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
                filter === "all"
                  ? "bg-cyan-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              View All Reports
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
                filter === "pending"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Action Required (Pending)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Zone</th>
                <th className="px-6 py-3">Cause</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Total Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center text-gray-500"
                  >
                    No damage reports found.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report, index) => (
                  <TableRow
                    key={report.id}
                    report={report}
                    index={index}
                    isExpanded={expandedRow === report.id}
                    isDispatching={dispatchingId === report.id}
                    onToggle={() => toggleRow(report.id)}
                    onDispatch={() => handleDispatch(report.id)}
                    formatTime={formatTime}
                    formatCurrency={formatCurrency}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════ TABLE ROW COMPONENT ═══════════
function TableRow({
  report,
  index,
  isExpanded,
  isDispatching,
  onToggle,
  onDispatch,
  formatTime,
  formatCurrency,
}) {
  const isApproved = report.status === "Approved";

  return (
    <>
      {/* Main Row */}
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors hover:bg-white/5 ${
          isExpanded ? "bg-white/5" : ""
        }`}
      >
        <td className="px-6 py-4 text-gray-400">{index + 1}.</td>
        <td className="px-6 py-4 text-gray-300">
          {formatTime(report.timestamp)}
        </td>
        <td className="px-6 py-4 text-gray-300">{report.sku || "—"}</td>
        <td className="px-6 py-4 font-medium text-white">
          {report.product || "—"}
        </td>
        <td className="px-6 py-4 text-gray-300">{report.zone || "—"}</td>
        <td className="max-w-[200px] truncate px-6 py-4">
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-400">
            {report.cause || "—"}
          </span>
        </td>
        <td className="px-6 py-4">
          {isApproved ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
              ✓ Approved
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
              ● Pending Audit
            </span>
          )}
        </td>
        <td className="px-6 py-4 text-right font-medium text-white">
          {formatCurrency(report.incidentLoss)} LKR
        </td>
      </tr>

      {/* ── Evidence Drawer (Expanded) ── */}
      <tr>
        <td colSpan={8} className="p-0">
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="border-l-4 border-cyan-500 bg-white/5 px-8 py-6 backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* LEFT — Media Evidence */}
                <div className="space-y-4">
                  {/* Image */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      📷 Evidence Image
                    </p>
                    {report.imageUrl ? (
                      <img
                        src={report.imageUrl}
                        alt={`Evidence for ${report.product}`}
                        className="h-40 w-full rounded-lg object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg bg-gray-700 ring-1 ring-white/10">
                        <div className="text-center">
                          <svg
                            className="mx-auto h-8 w-8 text-gray-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">
                            No Image Provided
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audio */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      🔊 Audio Evidence
                    </p>
                    {report.audioUrl ? (
                      <audio
                        controls
                        src={report.audioUrl}
                        className="w-full"
                        preload="none"
                      />
                    ) : (
                      <p className="text-sm italic text-gray-600">
                        No Audio Recorded
                      </p>
                    )}
                  </div>
                </div>

                {/* RIGHT — Action & Metadata */}
                <div className="flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-xs text-gray-500">Product</p>
                      <p className="font-semibold text-white">
                        {report.product || "—"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white/5 p-4">
                        <p className="text-xs text-gray-500">Zone</p>
                        <p className="font-semibold text-white">
                          {report.zone || "—"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-4">
                        <p className="text-xs text-gray-500">Loss</p>
                        <p className="font-semibold text-emerald-400">
                          {formatCurrency(report.incidentLoss)} LKR
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4">
                    {isApproved ? (
                      <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-400">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Dispatched
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDispatch();
                        }}
                        disabled={isDispatching}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:shadow-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDispatching ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Updating...
                          </>
                        ) : (
                          <>
                            🚀 Mark as Dispatched
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
