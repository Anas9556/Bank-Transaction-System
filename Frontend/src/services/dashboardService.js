import { apiRequest } from "./api.js";

export async function fetchDashboardData() {
  const [userResult, accountsResult, transactionsResult] = await Promise.allSettled([
    apiRequest("/auth/me"),
    apiRequest("/accounts"),
    apiRequest("/transactions"),
  ]);

  const user = userResult.status === "fulfilled" ? userResult.value?.user : null;
  if (user) {
    storeUser(user);
  }

  return {
    user,
    accounts: normalizeCollection(accountsResult, "accounts"),
    transactions: normalizeCollection(transactionsResult, "transactions"),
  };
}

export function createAccount() {
  return apiRequest("/accounts", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function createTransaction(payload) {
  return apiRequest("/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function normalizeCollection(result, key) {
  if (result.status === "rejected") {
    return {
      data: [],
      available: false,
      error: result.reason?.message || `Unable to load ${key}.`,
    };
  }

  const value = result.value;
  const list = Array.isArray(value)
    ? value
    : Array.isArray(value?.[key])
      ? value[key]
      : Array.isArray(value?.data)
        ? value.data
        : [];

  return {
    data: list,
    available: true,
    error: "",
  };
}

export function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem("ledgerly_user") || "null");
  } catch {
    return null;
  }
}

export function storeUser(user) {
  if (!user) return;
  const normalized = {
    name: user.name || "",
    email: user.email || user.emailL || "",
  };
  sessionStorage.setItem("ledgerly_user", JSON.stringify(normalized));
}
