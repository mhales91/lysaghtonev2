import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./Layout";
import Dashboard from "./Dashboard";
import Projects from "./Projects";
import ProjectDetail from "./ProjectDetail";
import Tasks from "./Tasks";
import Timesheets from "./Timesheets";
import Billing from "./Billing";
import CRM from "./CRM";
import Analytics from "./Analytics";
import Login from "./Login";
import Admin from "./Admin";
import JobsImport from "./JobsImport";
import TaskTemplates from "./TaskTemplates";

import AdminSettings from "./AdminSettings";

import UserManagement from "./UserManagement";

import LysaghtAI from "./ss/LysaghtAI-minimal";

import AIAssistantManager from "./AIAssistantManager";

import PromptLibraryManager from "./PromptLibraryManager";

import BillingAdmin from "./BillingAdmin";

import TOEAdmin from "./TOEAdmin";

import TOEManager from "./TOEManager";

import TOESign from "./TOESign";

import DashboardSettings from "./DashboardSettings";

import AnalyticsSettings from "./AnalyticsSettings";

import { UserProvider } from "../contexts/UserContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <UserProvider>
        <Layout />
      </UserProvider>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: "projects",
        element: <Projects />
      },
      {
        path: "projects/:id",
        element: <ProjectDetail />
      },
      {
        path: "tasks",
        element: <Tasks />
      },
      {
        path: "timesheets",
        element: <Timesheets />
      },
      {
        path: "billing",
        element: <Billing />
      },
      {
        path: "crm",
        element: <CRM />
      },
      {
        path: "analytics",
        element: <Analytics />
      },
      {
        path: "admin",
        element: <Admin />
      },
      {
        path: "jobs-import",
        element: <JobsImport />
      },
      {
        path: "task-templates",
        element: <TaskTemplates />
      },
      {
        path: "admin-settings",
        element: <AdminSettings />
      },
      {
        path: "user-management",
        element: <UserManagement />
      },
      {
        path: "LysaghtAI",
        element: <LysaghtAI />
      },
      {
        path: "ai-assistant-manager",
        element: <AIAssistantManager />
      },
      {
        path: "prompt-library-manager",
        element: <PromptLibraryManager />
      },
      {
        path: "billing-admin",
        element: <BillingAdmin />
      },
      {
        path: "toe-admin",
        element: <TOEAdmin />
      },
      {
        path: "toe-manager",
        element: <TOEManager />
      },
      {
        path: "toe-sign",
        element: <TOESign />
      },
      {
        path: "dashboard-settings",
        element: <DashboardSettings />
      },
      {
        path: "analytics-settings",
        element: <AnalyticsSettings />
      }
    ]
  },
  {
    path: "/login",
    element: <Login />
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;