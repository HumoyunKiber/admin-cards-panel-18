import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SimCardProvider } from "./contexts/SimCardContext";
import { ShopProvider } from "./contexts/ShopContext";
import Login from "./pages/Login";
import AdminLayout from "./components/admin/AdminLayout";
import Statistics from "./pages/admin/Statistics";
import SimCards from "./pages/admin/SimCards";
import Shops from "./pages/admin/Shops";
import Map from "./pages/admin/Map";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const LoginRedirect: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/admin" replace /> : <Login />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SimCardProvider>
          <ShopProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LoginRedirect />} />
                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<Statistics />} />
                  <Route path="simcards" element={<SimCards />} />
                  <Route path="shops" element={<Shops />} />
                  <Route path="map" element={<Map />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ShopProvider>
        </SimCardProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
