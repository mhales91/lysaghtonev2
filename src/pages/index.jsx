import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import CRM from "./CRM";

import Timesheets from "./Timesheets";

import Projects from "./Projects";

import Billing from "./Billing";

import Tasks from "./Tasks";

import TOESign from "./TOESign";

import Admin from "./Admin";

import TaskTemplates from "./TaskTemplates";

import AdminSettings from "./AdminSettings";

import UserManagement from "./UserManagement";

import LysaghtAI from "./LysaghtAI";

import AIAssistantManager from "./AIAssistantManager";

import PromptLibraryManager from "./PromptLibraryManager";

import BillingAdmin from "./BillingAdmin";

import TOEAdmin from "./TOEAdmin";

import JobsImport from "./JobsImport";

import Analytics from "./Analytics";

import AnalyticsSettings from "./AnalyticsSettings";

import ProjectDetail from "./ProjectDetail";

import TOEManager from "./TOEManager";

import DashboardSettings from "./DashboardSettings";

import Agent from "./Agent";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    CRM: CRM,
    
    Timesheets: Timesheets,
    
    Projects: Projects,
    
    Billing: Billing,
    
    Tasks: Tasks,
    
    TOESign: TOESign,
    
    Admin: Admin,
    
    TaskTemplates: TaskTemplates,
    
    AdminSettings: AdminSettings,
    
    UserManagement: UserManagement,
    
    LysaghtAI: LysaghtAI,
    
    AIAssistantManager: AIAssistantManager,
    
    PromptLibraryManager: PromptLibraryManager,
    
    BillingAdmin: BillingAdmin,
    
    TOEAdmin: TOEAdmin,
    
    JobsImport: JobsImport,
    
    Analytics: Analytics,
    
    AnalyticsSettings: AnalyticsSettings,
    
    ProjectDetail: ProjectDetail,
    
    TOEManager: TOEManager,
    
    DashboardSettings: DashboardSettings,
    
    Agent: Agent,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/CRM" element={<CRM />} />
                
                <Route path="/Timesheets" element={<Timesheets />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/Billing" element={<Billing />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/TOESign" element={<TOESign />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/TaskTemplates" element={<TaskTemplates />} />
                
                <Route path="/AdminSettings" element={<AdminSettings />} />
                
                <Route path="/UserManagement" element={<UserManagement />} />
                
                <Route path="/LysaghtAI" element={<LysaghtAI />} />
                
                <Route path="/AIAssistantManager" element={<AIAssistantManager />} />
                
                <Route path="/PromptLibraryManager" element={<PromptLibraryManager />} />
                
                <Route path="/BillingAdmin" element={<BillingAdmin />} />
                
                <Route path="/TOEAdmin" element={<TOEAdmin />} />
                
                <Route path="/JobsImport" element={<JobsImport />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/AnalyticsSettings" element={<AnalyticsSettings />} />
                
                <Route path="/ProjectDetail" element={<ProjectDetail />} />
                
                <Route path="/TOEManager" element={<TOEManager />} />
                
                <Route path="/DashboardSettings" element={<DashboardSettings />} />
                
                <Route path="/Agent" element={<Agent />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}