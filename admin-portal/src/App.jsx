import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import Companies from './pages/Companies';
import Trainings from './pages/Trainings';
import PlacementDrives from './pages/PlacementDrives';
import DriveDetail from './pages/DriveDetail';
import Applications from './pages/Applications';
import Interviews from './pages/Interviews';
import Results from './pages/Results';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="students/:id" element={<StudentDetail />} />
              <Route path="companies" element={<Companies />} />
              <Route path="trainings" element={<Trainings />} />
              <Route path="drives" element={<PlacementDrives />} />
              <Route path="drives/:id" element={<DriveDetail />} />
              <Route path="applications" element={<Applications />} />
              <Route path="interviews" element={<Interviews />} />
              <Route path="results" element={<Results />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
