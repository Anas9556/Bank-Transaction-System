import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/DashboardPage.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ProtectedLayout from "./components/ProtectedLayout.jsx";
import Accounts from "./pages/Accounts.jsx";
import AccountDetails from "./pages/AccountDetails.jsx";
import Transactions from "./pages/Transactions.jsx";
import TransactionDetails from "./pages/TransactionDetails.jsx";
import TransactionForm from "./pages/TransactionForm.jsx";
import Reports from "./pages/Reports.jsx";
import SystemConsole from "./pages/SystemConsole.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/system" element={<SystemConsole />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:accountId" element={<AccountDetails />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/new" element={<TransactionForm />} />
        <Route path="/transactions/:transactionId" element={<TransactionDetails />} />
        <Route path="/transfers" element={<TransactionForm transfer />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
