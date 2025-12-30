import React from 'react';
import { base44 } from '@/api/base44Client';
import Layout from "./Layout.jsx";

import BuildingSetupWizard from "./BuildingSetupWizard";

import Home from "./Home";

import MyBuildings from "./MyBuildings";

import Onboarding from "./Onboarding";

import RepBankAccount from "./RepBankAccount";

import RepBillingMonthlyEdit from "./RepBillingMonthlyEdit";

import RepBillingSend from "./RepBillingSend";

import RepBillingSettings from "./RepBillingSettings";

import RepBillingUnitCharges from "./RepBillingUnitCharges";

import RepBuildingSetup from "./RepBuildingSetup";

import RepDashboard from "./RepDashboard";

import RepFeeItems from "./RepFeeItems";

import RepPaymentsManage from "./RepPaymentsManage";

import RepPlan from "./RepPlan";

import RepReportsTotalFee from "./RepReportsTotalFee";

import RepReportsUnitFee from "./RepReportsUnitFee";

import RepReportsUnitPayments from "./RepReportsUnitPayments";

import RepRoleChange from "./RepRoleChange";

import RepUnits from "./RepUnits";

import RepUnitsInvite from "./RepUnitsInvite";

import RepUnitsReview from "./RepUnitsReview";

import TenantDashboard from "./TenantDashboard";

import TenantMyBills from "./TenantMyBills";

import TenantMyPayments from "./TenantMyPayments";

import TenantMyUnit from "./TenantMyUnit";

import AcceptInvite from "./AcceptInvite";

import Login from "./Login";

import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const PAGES = {
    
    BuildingSetupWizard: BuildingSetupWizard,
    
    Home: Home,
    
    MyBuildings: MyBuildings,
    
    Onboarding: Onboarding,
    
    RepBankAccount: RepBankAccount,
    
    RepBillingMonthlyEdit: RepBillingMonthlyEdit,
    
    RepBillingSend: RepBillingSend,
    
    RepBillingSettings: RepBillingSettings,
    
    RepBillingUnitCharges: RepBillingUnitCharges,
    
    RepBuildingSetup: RepBuildingSetup,
    
    RepDashboard: RepDashboard,
    
    RepFeeItems: RepFeeItems,
    
    RepPaymentsManage: RepPaymentsManage,
    
    RepPlan: RepPlan,
    
    RepReportsTotalFee: RepReportsTotalFee,
    
    RepReportsUnitFee: RepReportsUnitFee,
    
    RepReportsUnitPayments: RepReportsUnitPayments,
    
    RepRoleChange: RepRoleChange,
    
    RepUnits: RepUnits,
    
    RepUnitsInvite: RepUnitsInvite,
    
    RepUnitsReview: RepUnitsReview,
    
    TenantDashboard: TenantDashboard,
    
    TenantMyBills: TenantMyBills,
    
    TenantMyPayments: TenantMyPayments,
    
    TenantMyUnit: TenantMyUnit,
    
    AcceptInvite: AcceptInvite,

    Login: Login,
    
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
    const navigate = useNavigate();
    const currentPage = _getCurrentPage(location.pathname);



    React.useEffect(() => {
        const { data: { subscription } } = base44.supabase.auth.onAuthStateChange(async (event, session) => {
            // Check for OAuth callback params in URL to distinguish fresh logins from cached sessions
            if (event === 'SIGNED_IN') {
                if (location.pathname === '/' || location.pathname === '/Login') {
                   navigate('/Onboarding');
                }
            } else if (event === 'SIGNED_OUT') {
                navigate('/Login');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate, location.pathname]);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Login />} />
                
                
                <Route path="/BuildingSetupWizard" element={<BuildingSetupWizard />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/MyBuildings" element={<MyBuildings />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/RepBankAccount" element={<RepBankAccount />} />
                
                <Route path="/RepBillingMonthlyEdit" element={<RepBillingMonthlyEdit />} />
                
                <Route path="/RepBillingSend" element={<RepBillingSend />} />
                
                <Route path="/RepBillingSettings" element={<RepBillingSettings />} />
                
                <Route path="/RepBillingUnitCharges" element={<RepBillingUnitCharges />} />
                
                <Route path="/RepBuildingSetup" element={<RepBuildingSetup />} />
                
                <Route path="/RepDashboard" element={<RepDashboard />} />
                
                <Route path="/RepFeeItems" element={<RepFeeItems />} />
                
                <Route path="/RepPaymentsManage" element={<RepPaymentsManage />} />
                
                <Route path="/RepPlan" element={<RepPlan />} />
                
                <Route path="/RepReportsTotalFee" element={<RepReportsTotalFee />} />
                
                <Route path="/RepReportsUnitFee" element={<RepReportsUnitFee />} />
                
                <Route path="/RepReportsUnitPayments" element={<RepReportsUnitPayments />} />
                
                <Route path="/RepRoleChange" element={<RepRoleChange />} />
                
                <Route path="/RepUnits" element={<RepUnits />} />
                
                <Route path="/RepUnitsInvite" element={<RepUnitsInvite />} />
                
                <Route path="/RepUnitsReview" element={<RepUnitsReview />} />
                
                <Route path="/TenantDashboard" element={<TenantDashboard />} />
                
                <Route path="/TenantMyBills" element={<TenantMyBills />} />
                
                <Route path="/TenantMyPayments" element={<TenantMyPayments />} />
                
                <Route path="/TenantMyUnit" element={<TenantMyUnit />} />
                
                <Route path="/AcceptInvite" element={<AcceptInvite />} />

                <Route path="/Login" element={<Login />} />
                
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