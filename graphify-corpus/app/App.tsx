import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import AppLayout from '@/components/dashboard/AppLayout';

// Public pages
import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';

// Protected pages
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Strategy from './pages/Strategy';
import Outreach from './pages/Outreach';
import Pipeline from './pages/Pipeline';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes — wrapped in AuthGuard + AppLayout */}
            <Route
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/strategy" element={<Strategy />} />
              <Route path="/outreach" element={<Outreach />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
