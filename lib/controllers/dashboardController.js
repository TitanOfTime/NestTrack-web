import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Subscribes to real-time updates from the damage_reports collection.
 * @param {function} callback - Called with an array of report objects on every snapshot.
 * @returns {function} unsubscribe function
 */
export function subscribeToDamageReports(callback) {
  const q = query(
    collection(db, "damage_reports"),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    callback(reports);
  });
}

/**
 * Updates a damage report's status to "Approved".
 * @param {string} docId - The Firestore document ID.
 */
export async function markAsDispatched(docId) {
  const docRef = doc(db, "damage_reports", docId);
  await updateDoc(docRef, { status: "Approved" });
}

/**
 * Computes KPI data from an array of damage reports.
 * @param {Array} reports - Array of report objects.
 * @returns {{ totalDailyLoss: number, topDamagedItems: Array }}
 */
export function computeKPIs(reports) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayReports = reports.filter((r) => {
    if (!r.timestamp) return false;
    const ts = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
    return ts >= startOfDay;
  });

  const totalDailyLoss = todayReports.reduce(
    (sum, r) => sum + (r.incidentLoss || 0),
    0
  );

  // Count occurrences of each product across ALL reports
  const productCounts = {};
  reports.forEach((r) => {
    if (r.productName) {
      productCounts[r.productName] = (productCounts[r.productName] || 0) + 1;
    }
  });

  const topDamagedItems = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  return { totalDailyLoss, topDamagedItems };
}

/**
 * Computes analytics KPIs for the dashboard, filtered by time range.
 * @param {Array} reports - All reports.
 * @param {string} timeRange - "week" or "month".
 */
export function computeAnalyticsKPIs(reports, timeRange = "week") {
  const now = new Date();
  const cutoff = new Date(now);
  if (timeRange === "day") {
    cutoff.setDate(cutoff.getDate() - 1);
  } else if (timeRange === "week") {
    cutoff.setDate(cutoff.getDate() - 7);
  } else {
    cutoff.setDate(cutoff.getDate() - 30);
  }

  const filtered = reports.filter((r) => {
    if (!r.timestamp) return false;
    const ts = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
    return ts >= cutoff;
  });

  const totalLoss = filtered.reduce((s, r) => s + (r.incidentLoss || 0), 0);

  // Zone frequency (for trouble zone)
  const zoneCounts = {};
  filtered.forEach((r) => {
    if (r.warehouseZone) {
      zoneCounts[r.warehouseZone] = (zoneCounts[r.warehouseZone] || 0) + 1;
    }
  });
  const sortedZones = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1]);
  const topTroubleZone = sortedZones[0] ? { name: sortedZones[0][0], count: sortedZones[0][1] } : null;
  // Sub-pills for Top Trouble Zone are 2nd and 3rd trouble zones
  const troubleZonePills = sortedZones.slice(1, 3).map(([name]) => name);

  // Top 2 zones overall for Card 1 (Total Loss) sub-pills
  const topZonePills = sortedZones.slice(0, 2).map(([name]) => name);

  // Cause frequency (for Card 3 - Top Damage Zone / Damage Cause)
  const causeCounts = {};
  filtered.forEach((r) => {
    if (r.damageCause) {
      causeCounts[r.damageCause] = (causeCounts[r.damageCause] || 0) + 1;
    }
  });
  const sortedCauses = Object.entries(causeCounts).sort((a, b) => b[1] - a[1]);
  const topDamageCause = sortedCauses[0] ? { name: sortedCauses[0][0], count: sortedCauses[0][1] } : null;
  // Sub-pills for Top Damage Cause are 2nd and 3rd damage causes
  const damageCausePills = sortedCauses.slice(1, 3).map(([name]) => name);

  // Worst performing item by cumulative loss
  const itemLosses = {};
  filtered.forEach((r) => {
    if (r.productName) {
      itemLosses[r.productName] = (itemLosses[r.productName] || 0) + (r.incidentLoss || 0);
    }
  });
  const sortedItems = Object.entries(itemLosses).sort((a, b) => b[1] - a[1]);
  const worstItem = sortedItems[0] ? { name: sortedItems[0][0], loss: sortedItems[0][1] } : null;
  // Sub-pills for Worst Performing Item are 2nd and 3rd worst productNames
  const worstItemPills = sortedItems.slice(1, 3).map(([name]) => name);

  // Dynamic lossChartData based on timeRange
  let lossChartData = [];
  if (timeRange === "day") {
    const intervals = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"];
    lossChartData = intervals.map((label) => ({ label, loss: 0 }));
    filtered.forEach((r) => {
      if (!r.timestamp) return;
      const ts = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
      const hour = ts.getHours();
      const idx = Math.min(Math.floor(hour / 4), 5);
      lossChartData[idx].loss += r.incidentLoss || 0;
    });
  } else if (timeRange === "week") {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    lossChartData = dayNames.map((label) => ({ label, loss: 0 }));
    filtered.forEach((r) => {
      if (!r.timestamp) return;
      const ts = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
      let idx = ts.getDay() - 1;
      if (idx < 0) idx = 6;
      lossChartData[idx].loss += r.incidentLoss || 0;
    });
  } else {
    const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];
    lossChartData = weekLabels.map((label) => ({ label, loss: 0 }));
    filtered.forEach((r) => {
      if (!r.timestamp) return;
      const ts = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
      const dayOfMonth = ts.getDate();
      const idx = Math.min(Math.floor((dayOfMonth - 1) / 7), 3);
      lossChartData[idx].loss += r.incidentLoss || 0;
    });
  }

  // Hazard distribution (group by hazardType) for donut chart
  const hazardCounts = {};
  filtered.forEach((r) => {
    const type = r.hazardType || "Unknown";
    hazardCounts[type] = (hazardCounts[type] || 0) + 1;
  });
  const hazardEntries = Object.entries(hazardCounts).map(([name, value]) => ({ name, value }));
  hazardEntries.sort((a, b) => b.value - a.value);

  const totalReports = hazardEntries.reduce((sum, item) => sum + item.value, 0);
  let hazardDistribution = [];
  if (totalReports > 0) {
    const rawPct = hazardEntries.map(item => (item.value / totalReports) * 100);
    const roundedPct = rawPct.map(pct => Math.floor(pct));
    const remainders = rawPct.map((pct, idx) => ({ remainder: pct - roundedPct[idx], idx }));
    let sumRounded = roundedPct.reduce((a, b) => a + b, 0);
    let diff = 100 - sumRounded;

    remainders.sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < diff; i++) {
      roundedPct[remainders[i].idx] += 1;
    }

    hazardDistribution = hazardEntries.map((item, idx) => ({
      name: item.name,
      value: item.value,
      pct: roundedPct[idx]
    }));
  }

  // Status counts
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const newTodayCount = reports.filter((r) => {
    if (!r.timestamp) return false;
    const ts = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
    return ts >= startOfDay;
  }).length;

  const eff = (r) => {
    if (r.status?.toLowerCase().includes("pending")) return "Pending Audit";
    if (r.status?.toLowerCase().includes("approved")) return "Approved";
    return r.incidentLoss >= 10000 ? "Pending Audit" : "Approved";
  };

  const autoReviewedCount = filtered.filter((r) => (r.incidentLoss || 0) < 10000).length;
  const pendingCount = filtered.filter((r) => eff(r) === "Pending Audit").length;
  const approvedCount = filtered.filter((r) => eff(r) === "Approved").length;
  const total = filtered.length || 1;
  const recoverableRatio = {
    approved: Math.round((approvedCount / total) * 100),
    pending: 100 - Math.round((approvedCount / total) * 100),
  };

  return {
    totalLoss,
    topTroubleZone,
    troubleZonePills,
    topZonePills,
    topDamageCause,
    damageCausePills,
    worstItem,
    worstItemPills,
    lossChartData,
    hazardDistribution,
    newTodayCount,
    autoReviewedCount,
    pendingCount,
    recoverableRatio,
  };
}

/**
 * Generates and downloads a PDF report of damage records.
 * @param {Array} reports - Array of report objects to include.
 */
export async function generatePDFReport(reports) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const pdf = new jsPDF("landscape", "mm", "a4");

  // Title
  pdf.setFontSize(22);
  pdf.setTextColor(14, 165, 233); // sky-500
  pdf.text("NestTrack Audit Ledger", 14, 20);

  // Subtitle
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Table
  const headers = [["#", "Time", "SKU", "Product", "Zone", "Description", "Status", "Loss (LKR)"]];
  const rows = reports.map((r, i) => {
    const ts = r.timestamp?.toDate
      ? r.timestamp.toDate().toLocaleTimeString("en-GB")
      : "—";
    return [
      i + 1,
      ts,
      r.sku || "—",
      r.productName || "—",
      r.warehouseZone || "—",
      r.description || "—",
      r.status || "—",
      (r.incidentLoss || 0).toLocaleString(),
    ];
  });

  autoTable(pdf, {
    head: headers,
    body: rows,
    startY: 34,
    theme: "grid",
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });

  pdf.save("NestTrack_Audit_Ledger.pdf");
}
