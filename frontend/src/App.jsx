import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/auth/login.jsx';
import Signup from './pages/auth/signup.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;
