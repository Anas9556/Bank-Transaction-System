import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout.jsx";
import SystemUserLayout from "./system/SystemUserLayout.jsx";
import { apiRequest } from "../services/api.js";

const emptyCollection = { data: [], available: false, error: "" };

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspace, setWorkspace] = useState({
    loading: true,
    user: null,
    accounts: emptyCollection,
    transactions: emptyCollection,
    error: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRange, setSelectedRange] = useState("30D");

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      setWorkspace((current) => ({ ...current, loading: true, error: "" }));
      try {
        const userResponse = await apiRequest("/auth/me");
        if (!userResponse?.user) {
          throw new Error("The authentication response did not include a user.");
        }

        const [accountsResult, transactionsResult] = await Promise.allSettled([
          apiRequest("/accounts"),
          apiRequest("/transactions"),
        ]);

        const expired = [accountsResult, transactionsResult].find(
          (result) => result.status === "rejected" && result.reason?.status === 401
        );
        if (expired) {
          navigate("/login", { replace: true });
          return;
        }

        if (!active) return;
        setWorkspace({
          loading: false,
          user: userResponse.user,
          accounts: normalizeCollection(accountsResult, "accounts"),
          transactions: normalizeCollection(transactionsResult, "transactions"),
          error: "",
        });
      } catch (error) {
        if (!active) return;
        if (error.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setWorkspace((current) => ({
          ...current,
          loading: false,
          error: error.message || "Unable to load your session.",
        }));
      }
    }

    loadWorkspace();
    return () => {
      active = false;
    };
  }, [navigate, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  if (workspace.loading) {
    return (
      <div className="workspace-loading" role="status">
        <span className="spinner" aria-hidden="true" />
        <span>Verifying your ledger session…</span>
      </div>
    );
  }

  if (workspace.error) {
    return (
      <main className="workspace-load-error">
        <span className="material-symbols-outlined" aria-hidden="true">cloud_off</span>
        <h1>Workspace unavailable</h1>
        <p>{workspace.error}</p>
        <button className="primary-button" type="button" onClick={refresh}>Try again</button>
      </main>
    );
  }

  const isSystemRoute = location.pathname === "/system";
  if (workspace.user?.systemUser && !isSystemRoute) return <Navigate to="/system" replace />;
  if (!workspace.user?.systemUser && isSystemRoute) return <Navigate to="/dashboard" replace />;

  const outlet = <Outlet context={{ ...workspace, refresh, selectedRange, setSelectedRange }} />;
  return workspace.user?.systemUser
    ? <SystemUserLayout user={workspace.user}>{outlet}</SystemUserLayout>
    : <DashboardLayout user={workspace.user} selectedRange={selectedRange} onRangeChange={setSelectedRange}>{outlet}</DashboardLayout>;
}

function normalizeCollection(result, key) {
  if (result.status === "rejected") {
    return {
      data: [],
      available: false,
      error: result.reason?.message || `Unable to load ${key}.`,
    };
  }

  const records = result.value?.[key];
  if (!Array.isArray(records)) {
    return {
      data: [],
      available: false,
      error: `The API response for ${key} did not contain a ${key} list.`,
    };
  }

  return { data: records, available: true, error: "" };
}
