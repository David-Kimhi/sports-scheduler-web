import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.tsx';
import Dashboard from './pages/Dashboard.tsx';
import EntityPage from './pages/EntityPage.tsx';
import Login from './features/auth/Login.tsx';
import Register from './features/auth/Register.tsx';
import { useEffect } from "react";
import { setThemeVariablesFromArray } from "./utils/shadeGenerator.utils.ts";

function App() {
  useEffect(() => {
    setThemeVariablesFromArray(["#F2F4CB", "#B7990D", "#110B11", "#8CADA7", "#A5D0A8"]);
  }, []);

  return (
    <div className='bg-primary'>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/entity/:type/:id" element={<EntityPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
    </div>
  );
}

export default App;
