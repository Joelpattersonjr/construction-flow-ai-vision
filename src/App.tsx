
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
import Forms from "./pages/Forms";
import { FormFill } from "./pages/FormFill";
import { PublicFormFill } from "./pages/PublicFormFill";
import { ApprovalDashboard } from "./pages/ApprovalDashboard";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import { AppLayout } from "@/components/layout/AppLayout";
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
                        <AppLayout>
                          <Index />
                        </AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <AdminDashboard />
                        </AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects" 
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Projects />
                        </AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects/:projectId" 
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <ProjectDetails />
                        </AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/files" 
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <FileManagement />
                        </AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/tasks" 
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Tasks />
                        </AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects/:projectId/permissions" 
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <ProjectPermissions />
                        </AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/calendar" 
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Calendar />
                        </AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                   <Route 
                    path="/schedule-builder" 
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <ScheduleBuilder />
                        </AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                   <Route 
                     path="/daily-reports" 
                     element={
                       <ProtectedRoute>
                         <AppLayout>
                           <DailyReports />
                         </AppLayout>
                       </ProtectedRoute>
                     } 
                   />
                   <Route 
                     path="/forms" 
                     element={
                       <ProtectedRoute>
                         <AppLayout>
                           <Forms />
                         </AppLayout>
                       </ProtectedRoute>
                     } 
                   />
                   <Route 
                     path="/forms/fill/:formId" 
                     element={
                       <ProtectedRoute>
                         <AppLayout>
                           <FormFill />
                         </AppLayout>
                       </ProtectedRoute>
                     } 
                    />
                   <Route 
                     path="/approvals" 
                     element={
                       <ProtectedRoute>
                         <AppLayout>
                           <ApprovalDashboard />
                         </AppLayout>
                       </ProtectedRoute>
                     } 
                   />
                   <Route
                     path="/profile"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Profile />
                        </AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/subscription"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Subscription />
                        </AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                   <Route 
                     path="/testing" 
                     element={
                       <ProtectedRoute>
                         <AppLayout>
                           <Testing />
                         </AppLayout>
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
                  <Route path="/success" element={<PaymentSuccess />} />
                  <Route path="/cancel" element={<PaymentCancel />} />
                  <Route path="/test" element={<div>TEST ROUTE WORKS</div>} />
                  <Route path="/invite/:token" element={<InviteAcceptance />} />
                  <Route path="/public/forms/:formId" element={<PublicFormFill />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
