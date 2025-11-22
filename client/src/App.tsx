import LoginCard from '@/components/LoginCard'
import RegisterCard from '@/components/RegisterCard'
import HomePage from '@/components/HomePage'
import AdminPage from '@/components/AdminPage'
import RequireRole from '@/components/RequireRole'

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'

function App() {
  

  return (
    <Router>
      <div className='flex flex-col grow'>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginCard />} />
          <Route path="/signup" element={<RegisterCard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/admin" element={<RequireRole roles="ADMIN"><AdminPage /></RequireRole>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
