import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.tsx';
import Dashboard from './pages/Dashboard.tsx';
import EntityPage from './pages/EntityPage.tsx';
import Login from './features/auth/Login.tsx';
import Register from './features/auth/Register.tsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/entity/:type/:id" element={<EntityPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
