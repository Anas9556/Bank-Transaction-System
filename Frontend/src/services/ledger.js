export const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatCurrencyTotals(records) {
  const totals = new Map();
  records.forEach((record) => {
    const currency = record.currency || "INR";
    totals.set(currency, (totals.get(currency) || 0) + (Number(record.balance) || 0));
  });
  if (!totals.size) return formatMoney(0);
  return [...totals.entries()]
    .map(([currency, amount]) => totals.size === 1 ? formatMoney(amount, currency) : `${currency} ${formatMoney(amount, currency)}`)
    .join(" · ");
}

export function formatDate(value, options = {}) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", options).format(date);
}

export function transactionDirection(transaction) {
  if (transaction.direction === "internal") return "internal";
  if (transaction.direction === "credit" || transaction.direction === "debit") {
    return transaction.direction;
  }
  if (transaction.fromAccount && transaction.toAccount && transaction.accountId) {
    return transaction.toAccount === transaction.accountId ? "credit" : "debit";
  }
  return "unknown";
}

export function filterTransactionsByRange(transactions, range) {
  if (range === "All") return transactions;
  const days = Number.parseInt(range, 10);
  if (!Number.isFinite(days)) return transactions;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return transactions.filter((transaction) => {
    const createdAt = new Date(transaction.createdAt);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= cutoff;
  });
}

export function accountLabel(account, index = 0) {
  return account?.name || `Ledger Account ${index + 1}`;
}

export function transactionLabel(transaction) {
  if (transaction.direction === "credit") return "Incoming transfer";
  if (transaction.direction === "debit") return "Outgoing transfer";
  if (transaction.direction === "internal") return "Internal transfer";
  return transaction.description || "Ledger transaction";
}

export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}
