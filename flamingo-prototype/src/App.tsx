import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getRole } from './lib/session';
import DemoBanner from './components/DemoBanner';
import TopBar from './components/TopBar';
import RolePicker from './pages/RolePicker';
import RoleEntry from './pages/RoleEntry';
import StudentCabinet from './pages/StudentCabinet';
import TeacherCabinet from './pages/TeacherCabinet';
import { SchoolCabinet, ParentCabinet } from './pages/SimpleCabinet';
import { AdminPanel, AdminReports } from './pages/AdminPanel';
import Courses from './pages/Courses';
import Lesson from './pages/Lesson';
import { PrivacySettings, SecuritySettings } from './pages/Settings';

function Home() {
  const role = getRole();
  if (!role) return <RolePicker />;
  if (role === 'teacher') return <TeacherCabinet />;
  if (role === 'admin') return <AdminPanel />;
  if (role === 'school') return <SchoolCabinet />;
  if (role === 'parent') return <ParentCabinet />;
  return <StudentCabinet />;
}

function Cabinet() {
  const role = getRole();
  if (role === 'teacher') return <TeacherCabinet />;
  if (role === 'admin') return <AdminPanel />;
  if (role === 'school') return <SchoolCabinet />;
  if (role === 'parent') return <ParentCabinet />;
  return <StudentCabinet />;
}

export default function App() {
  const role = getRole();
  return (
    <BrowserRouter>
      <DemoBanner />
      {role && <TopBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/r/:role" element={<RoleEntry />} />
        <Route path="/cabinet" element={<Cabinet />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/lesson/:id" element={<Lesson />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/settings/privacy" element={<PrivacySettings />} />
        <Route path="/settings/security" element={<SecuritySettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
