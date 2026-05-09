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
