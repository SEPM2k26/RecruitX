import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './components/RequireAuth.jsx';
import StudentLayout from './components/StudentLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { ForgotPasswordPage, LoginPage, RegisterPage } from './pages/AuthPages.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ResumePage from './pages/ResumePage.jsx';
import DrivesPage from './pages/DrivesPage.jsx';
import DriveDetailPage from './pages/DriveDetailPage.jsx';
import ApplicationsPage from './pages/ApplicationsPage.jsx';
import TrainingsPage from './pages/TrainingsPage.jsx';
import TrainingDetailPage from './pages/TrainingDetailPage.jsx';
import InterviewsPage from './pages/InterviewsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import { Loading } from './components/Feedback.jsx';

function HomeRedirect(){const {user,checking}=useAuth();return checking?<Loading label="Checking your session…"/>:<Navigate to={user?'/dashboard':'/login'} replace/>;}

export default function App(){
  return <Routes>
    <Route path="/" element={<HomeRedirect/>}/>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/register" element={<RegisterPage/>}/>
    <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
    <Route element={<RequireAuth/>}>
      <Route element={<StudentLayout/>}>
        <Route path="/dashboard" element={<DashboardPage/>}/>
        <Route path="/profile" element={<ProfilePage/>}/>
        <Route path="/resume" element={<ResumePage/>}/>
        <Route path="/drives" element={<DrivesPage/>}/>
        <Route path="/drives/:id" element={<DriveDetailPage/>}/>
        <Route path="/applications" element={<ApplicationsPage/>}/>
        <Route path="/trainings" element={<TrainingsPage/>}/>
        <Route path="/trainings/:id" element={<TrainingDetailPage/>}/>
        <Route path="/interviews" element={<InterviewsPage/>}/>
        <Route path="/notifications" element={<NotificationsPage/>}/>
      </Route>
    </Route>
    <Route path="*" element={<HomeRedirect/>}/>
  </Routes>;
}
