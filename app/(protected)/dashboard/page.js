"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  subscribeToDamageReports,
  computeAnalyticsKPIs,
  generatePDFReport,
} from "@/lib/controllers/dashboardController";

const DONUT_COLORS = ["#ef4444", "#22c55e", "#eab308", "#06b6d4", "#a855f7", "#f97316"];

export default function DashboardPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");

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

  const kpis = computeAnalyticsKPIs(reports, timeRange);

  const isToday = (timestamp) => {
    if (!timestamp) return false;
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  const dailyDispatchManifest = reports.filter((r) => {
    if (!isToday(r.timestamp)) return false;
    const autoApproved = (r.incidentLoss || 0) < 10000;
    const manuallyApproved = r.status?.toLowerCase().includes("approved");
    return autoApproved || manuallyApproved;
  });

  const fmt = (v) => (v || 0).toLocaleString("en-US");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-white/5" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 h-64 animate-pulse rounded-xl bg-white/5" />
          <div className="col-span-2 h-64 animate-pulse rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 ring-2 ring-gray-600">
            <svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Hello Nimal!</h1>
        </div>
        <span className="text-xl font-semibold italic text-cyan-400">NestTrack.</span>
      </div>

      {/* ═══ ROW 1: SORT + KPI CARDS ═══ */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm font-bold uppercase tracking-wider text-white">Sort By</span>
          {["day", "week", "month"].map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                timeRange === r
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Monthly Loss */}
          <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-gray-400">
                {timeRange === "day" ? "Total Daily Loss" : timeRange === "week" ? "Total Weekly Loss" : "Total Monthly Loss"}
              </p>
              <div className="rounded-lg bg-cyan-500/10 p-2">
                <svg className="h-5 w-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-red-500">{fmt(kpis.totalLoss)} LKR</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">+25%</span>
              <span className="text-xs text-gray-500">
                {timeRange === "day" ? "Since Yesterday" : timeRange === "week" ? "Since Last Week" : "Since Last Month"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(kpis.topZonePills || []).map((zone, i) => (
                <span key={zone} className="flex items-center gap-1.5 text-xs text-gray-400">
                  {zone}
                  <span className={`h-2 w-2 rounded-full ${i === 0 ? "bg-orange-500" : "bg-emerald-500"}`} />
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <p className="text-sm font-medium text-gray-400">Top Trouble Zone</p>
            <p className="mt-1 text-2xl font-black uppercase text-red-500">{kpis.topTroubleZone?.name || "—"}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">{kpis.topTroubleZone?.count || 0}</span>
              <span className="text-xs text-gray-500">
                {timeRange === "day" ? "Incidents Today" : timeRange === "week" ? "Incidents this Week" : "Incidents this Month"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(kpis.troubleZonePills || []).map((zone, i) => (
                <span key={zone} className="flex items-center gap-1.5 text-xs text-gray-400">
                  {zone}
                  <span className={`h-2 w-2 rounded-full ${i === 0 ? "bg-orange-500" : "bg-emerald-500"}`} />
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <p className="text-sm font-medium text-gray-400">Top Damage Cause</p>
            <p className="mt-1 text-2xl font-black uppercase text-red-500">{kpis.topDamageCause?.name || "—"}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">{kpis.topDamageCause?.count || 0}</span>
              <span className="text-xs text-gray-500">
                {timeRange === "day" ? "Incidents Today" : timeRange === "week" ? "Incidents this Week" : "Incidents this Month"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(kpis.damageCausePills || []).map((cause, i) => (
                <span key={cause} className="flex items-center gap-1.5 text-xs text-gray-400">
                  {cause}
                  <span className={`h-2 w-2 rounded-full ${i === 0 ? "bg-orange-500" : "bg-emerald-500"}`} />
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <p className="text-sm font-medium text-gray-400">Worst Performing Item</p>
            <p className="mt-1 text-2xl font-black uppercase text-red-500">{kpis.worstItem?.name || "—"}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">{fmt(kpis.worstItem?.loss || 0)} LKR</span>
              <span className="text-xs text-gray-500">Loss</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(kpis.worstItemPills || []).map((item, i) => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-gray-400">
                  {item}
                  <span className={`h-2 w-2 rounded-full ${i === 0 ? "bg-orange-500" : "bg-emerald-500"}`} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ROW 2: CHARTS ═══ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Financial Loss Trend */}
        <div className="rounded-xl border border-white/10 bg-[#111111] p-5 lg:col-span-3">
          <p className="mb-4 text-sm font-medium text-gray-400">Financial Loss Trend</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={kpis.lossChartData}>
              <XAxis dataKey="label" stroke="#6b7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
                itemStyle={{ color: "#0ea5e9" }}
              />
              <Line type="monotone" dataKey="loss" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4, fill: "#0ea5e9" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Hazard Risk Distribution */}
        <div className="rounded-xl border border-white/10 bg-[#111111] p-5 lg:col-span-2">
          <p className="mb-4 text-sm font-medium text-gray-400">Hazard Risk Distribution</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              {kpis.hazardDistribution.slice(0, 4).map((entry, i) => {
                const pct = entry.pct;
                return (
                  <div key={entry.name} className="flex items-center justify-between">
                    <span className="max-w-[120px] truncate text-xs text-gray-400">{entry.name}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="w-[140px]">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={kpis.hazardDistribution.slice(0, 4)} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                    {kpis.hazardDistribution.slice(0, 4).map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ROW 3: STATUS PILLS ═══ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#111111] px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-500 text-sm font-bold text-cyan-400">{kpis.newTodayCount}</span>
          <span className="text-sm font-medium text-white">New Reports Today</span>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#111111] px-5 py-4">
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">{kpis.autoReviewedCount} Reports</span>
          <span className="text-sm font-medium text-white">Auto Reviewed</span>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#111111] px-5 py-4">
          <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">{kpis.pendingCount} Reports</span>
          <span className="text-sm font-medium text-white">to be Reviewed</span>
        </div>
      </div>

      {/* ═══ ROW 4: RECOVERABLE PRODUCT RATIO ═══ */}
      <div>
        <div className="flex h-8 overflow-hidden rounded-full">
          <div className="flex items-center justify-center bg-emerald-500 text-xs font-bold text-white" style={{ width: `${kpis.recoverableRatio.approved}%` }}>
            {kpis.recoverableRatio.approved}%
          </div>
          <div className="flex items-center justify-center bg-red-500 text-xs font-bold text-white" style={{ width: `${kpis.recoverableRatio.pending}%` }}>
            {kpis.recoverableRatio.pending}%
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-gray-500">Recoverable Product Ratio</p>
      </div>

      {/* ═══ ROW 5: EXPORT ═══ */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            const exportData = dailyDispatchManifest.map((r) => ({ ...r, status: getEffectiveStatus(r) }));
            generatePDFReport(exportData);
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30"
        >
          Export Report
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </button>
      </div>
    </div>
  );
}
