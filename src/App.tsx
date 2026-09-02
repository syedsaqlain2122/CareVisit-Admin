import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { RequireAuth } from '@/components/RequireAuth';
import { StoreProvider } from '@/lib/store';
import { AdminsPage } from '@/pages/AdminsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { PharmacyPage } from '@/pages/PharmacyPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { RequestsPage } from '@/pages/RequestsPage';
import { StaffPage } from '@/pages/StaffPage';
import { VerificationPage } from '@/pages/VerificationPage';

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/verification" element={<VerificationPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/pharmacy" element={<PharmacyPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/admins" element={<AdminsPage />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
