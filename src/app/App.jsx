// src/App.jsx
import { useState, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Login from "../pages/LoginPage";
import { routes, getRouteByPath, getRouteByNav } from "./routes";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const storedUser = sessionStorage.getItem("authUser");
    setIsAuthenticated(!!token);
    setUser(storedUser ? JSON.parse(storedUser) : null);
    setCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login", { replace: true });
  };

  if (checkingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    if (location.pathname !== "/login") {
      return <Navigate to="/login" replace />;
    }
    return (
      <Login
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setIsAuthenticated(true);
          navigate("/dashboard", { replace: true });
        }}
      />
    );
  }

  const activeNav = getRouteByPath(location.pathname).nav;
  const handleNavChange = (nav) => navigate(getRouteByNav(nav).path);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />

      {routes.map(({ path, nav, component: Page }) => (
        <Route
          key={path}
          path={path}
          element={
            <MainLayout
              activeNav={activeNav}
              onNavChange={handleNavChange}
              onLogout={handleLogout}
              user={user}
            >
              <Page />
            </MainLayout>
          }
        />
      ))}

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;