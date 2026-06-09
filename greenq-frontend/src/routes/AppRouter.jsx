import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute.jsx";
import AppLayout from "../layouts/AppLayout.jsx";

import LoginPage from "../pages/LoginPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import WorkerHomePage from "../pages/WorkerHomePage.jsx";
import ScanBatchPage from "../pages/ScanBatchPage.jsx";

import CropListPage from "../pages/crops/CropListPage.jsx";
import CropDetailPage from "../pages/crops/CropDetailPage.jsx";
import CropItemSettingPage from "../pages/crops/CropItemSettingPage.jsx";

import ZoneListPage from "../pages/zones/ZoneListPage.jsx";
import ZoneDetailPage from "../pages/zones/ZoneDetailPage.jsx";

import BatchDetailPage from "../pages/batches/BatchDetailPage.jsx";

import EnvironmentPage from "../pages/environment/EnvironmentPage.jsx";
import EnvironmentLogDetailPage from "../pages/environment/EnvironmentLogDetailPage.jsx";
import SimulationPage from "../pages/simulation/SimulationPage.jsx";

import QualityPage from "../pages/quality/QualityPage.jsx";
import QualityEntryPage from "../pages/quality/QualityEntryPage.jsx";
import QualityDetailPage from "../pages/quality/QualityDetailPage.jsx";

import IssueListPage from "../pages/issues/IssueListPage.jsx";
import IssueDetailPage from "../pages/issues/IssueDetailPage.jsx";

import ReportListPage from "../pages/reports/ReportListPage.jsx";
import ReportDetailPage from "../pages/reports/ReportDetailPage.jsx";

import UserListPage from "../pages/users/UserListPage.jsx";
import DeletedDataPage from "../pages/deletedData/DeletedDataPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

import { defaultPathForRole, getCurrentUser, hasLogin } from "../utils/auth.js";


function initialPath() {
  const user = getCurrentUser();
  return defaultPathForRole(user.roleCode || user.role);
}

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={hasLogin() ? initialPath() : "/login"} replace />}
      />

      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/worker" element={<WorkerHomePage />} />
          <Route path="/scan/batch/:qrToken" element={<ScanBatchPage />} />

          <Route path="/crops" element={<CropListPage />} />
          <Route path="/crops/:cropId" element={<CropDetailPage />} />
          <Route path="/crops/:cropId/item-settings" element={<CropItemSettingPage />} />

          <Route path="/zones" element={<ZoneListPage />} />
          <Route path="/zones/:zoneId" element={<ZoneDetailPage />} />

          <Route path="/batches/:batchId" element={<BatchDetailPage />} />

          <Route path="/environment" element={<EnvironmentPage />} />
          <Route path="/environment/logs/:envLogId" element={<EnvironmentLogDetailPage />} />
          <Route path="/simulation" element={<SimulationPage />} />

          <Route path="/quality" element={<QualityPage />} />
          <Route path="/quality/new" element={<QualityEntryPage />} />
          <Route path="/quality/:measurementId" element={<QualityDetailPage />} />

          <Route path="/issues" element={<IssueListPage />} />
          <Route path="/issues/:issueType/:issueId" element={<IssueDetailPage />} />

          <Route path="/reports" element={<ReportListPage />} />
          <Route path="/reports/:reportId" element={<ReportDetailPage />} />

          <Route path="/users" element={<UserListPage />} />
          <Route path="/trash" element={<DeletedDataPage />} />
          <Route path="/deleted-data" element={<DeletedDataPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
