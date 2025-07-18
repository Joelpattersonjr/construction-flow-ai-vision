
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import '@/i18n';
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/AdminDashboard";
import InviteAcceptance from "./pages/InviteAcceptance";
import FileManagement from "./pages/FileManagement";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectPermissions from "./pages/ProjectPermissions";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import ScheduleBuilder from "./pages/ScheduleBuilder";
import DailyReports from "./pages/DailyReports";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Documentation from "./pages/Documentation";
import GettingStarted from "./pages/GettingStarted";
import Testing from "./pages/Testing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App: React.FC = () => {
  console.log('🔥 App component rendering');
  
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <UserPreferencesProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/" element={<Landing />} />
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <Index />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/projects" 
                      element={
                        <ProtectedRoute>
                          <Projects />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/projects/:projectId" 
                      element={
                        <ProtectedRoute>
                          <ProjectDetails />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/files" 
                      element={
                        <ProtectedRoute>
                          <FileManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/tasks" 
                      element={
                        <ProtectedRoute>
                          <Tasks />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/projects/:projectId/permissions" 
                      element={
                        <ProtectedRoute>
                          <ProjectPermissions />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/calendar" 
                      element={
                        <ProtectedRoute>
                          <Calendar />
                        </ProtectedRoute>
                      } 
                    />
                     <Route 
                      path="/schedule-builder" 
                      element={
                        <ProtectedRoute>
                          <ScheduleBuilder />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/daily-reports" 
                      element={
                        <ProtectedRoute>
                          <DailyReports />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/subscription"
                      element={
                        <ProtectedRoute>
                          <Subscription />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/getting-started" element={<GettingStarted />} />
                  <Route path="/documentation" element={<Documentation />} />
                    <Route 
                      path="/testing" 
                      element={
                        <ProtectedRoute>
                          <Testing />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/success" element={<PaymentSuccess />} />
                    <Route path="/cancel" element={<PaymentCancel />} />
                    <Route path="/test" element={<div>TEST ROUTE WORKS</div>} />
                    <Route path="/invite/:token" element={<InviteAcceptance />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
