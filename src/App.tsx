import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import InviteAcceptance from "./pages/InviteAcceptance";
import FileManagementSimple from "./pages/FileManagementSimple";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectPermissions from "./pages/ProjectPermissions";
import Tasks from "./pages/Tasks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  console.log('🔥 App component rendering');
  
  // Simple test to check if React is working
  const isTestMode = window.location.pathname === '/basic-test';
  
  if (isTestMode) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>App is Loading!</h1>
        <p>If you can see this, the basic React app is working.</p>
        <p>Current time: {new Date().toLocaleString()}</p>
        <button onClick={() => alert('Button works!')}>Test Button</button>
        <hr />
        <p>Try these links:</p>
        <a href="/test" style={{ marginRight: '10px' }}>Simple Test</a>
        <a href="/" style={{ marginRight: '10px' }}>Home</a>
        <a href="/tasks">Tasks</a>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/" 
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
                    <FileManagementSimple />
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
              <Route path="/basic-test" element={
                <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                  <h1>Basic Test Route</h1>
                  <p>If you can see this, React routing is working.</p>
                  <p>Current time: {new Date().toLocaleString()}</p>
                  <button onClick={() => alert('Button works!')}>Test Button</button>
                </div>
              } />
              <Route path="/test" element={<div style={{ padding: '20px' }}>TEST ROUTE WORKS - App is loading properly!</div>} />
              <Route path="/simple-tasks" element={
                <ProtectedRoute>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold mb-4">Simple Tasks Page</h1>
                    <p>If you can see this, the routing and authentication are working.</p>
                    <p>Navigate to /tasks to test the full Tasks page.</p>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/invite/:token" element={<InviteAcceptance />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;