import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, Users, Receipt, CreditCard, Settings, 
  ChevronRight, AlertCircle, CheckCircle2, Clock,
  FileText, PlusCircle, Send, BarChart3, Menu, X
} from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, user, building, membership, error } = useBuildingAuth(buildingId, "대표자");
  const [stats, setStats] = useState({
    totalUnits: 0,
    invitedUnits: 0,
    unpaidCount: 0,
    currentMonthTotal: 0
  });

  useEffect(() => {
    async function loadStats() {
      console.log("Loading stats for buildingId:", buildingId);
      if (!buildingId || isLoading || !building) return;
      
      if (building.status === "draft" || building.setup_step < 5) {
        console.log("Building is draft or incomplete. Redirecting...");
        // navigate(createPageUrl(`BuildingSetupWizard?buildingId=${buildingId}`));
        // return;
      }
      
      try {
        console.log("Fetching units...");
        // Try fetching without status filter first to debug
        const allUnits = await base44.entities.Unit.filter({
          building_id: buildingId
        });
        console.log("All Units found:", allUnits);

        const unitsData = allUnits.filter(u => u.status === 'active');
        console.log("Active Units:", unitsData);

        const currentDate = new Date();
        const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        console.log("Fetching payments for:", yearMonth);
        const payments = await base44.entities.PaymentStatus.filter({
          building_id: buildingId,
          year_month: yearMonth
        });
        console.log("Payments found:", payments);

        const unpaid = payments.filter(p => p.status === "미납").length;

        const cycles = await base44.entities.BillCycle.filter({
          building_id: buildingId
        });
        const currentCycle = cycles.find(c => c.year_month === yearMonth);
        console.log("Current Cycle:", currentCycle);

        setStats({
          totalUnits: unitsData.length,
          invitedUnits: unitsData.filter(u => u.tenant_phone).length,
          unpaidCount: unpaid,
          currentMonthTotal: currentCycle?.total_amount || 0
        });
      } catch (err) {
        console.error("Error loading stats:", err);
      }
    }
    loadStats();
  }, [buildingId, isLoading, building, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">접근 오류</h2>
            <p className="text-slate-500 mb-4">{error}</p>
            <Button onClick={() => navigate(createPageUrl("MyBuildings"))}>
              내 건물 목록으로
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quickActions = [
    { label: "세대 목록", icon: Users, page: "RepUnits", color: "purple" },
    { label: "입주자 초대", icon: Send, page: "RepUnitsInvite", color: "orange" },
    { label: "관리비 항목", icon: FileText, page: "RepFeeItems", color: "indigo" },
    { label: "월별 관리비 입력", icon: PlusCircle, page: "RepBillingMonthlyEdit", color: "blue" },
    { label: "세대별 청구 확인", icon: Receipt, page: "RepBillingUnitCharges", color: "emerald" },
    { label: "청구서 발송", icon: Send, page: "RepBillingSend", color: "rose" },
    { label: "납부 현황 관리", icon: CreditCard, page: "RepPaymentsManage", color: "teal" },
  ];

  const sideMenuItems = [
    { label: "건물 기본정보", icon: Building2, page: "RepBuildingSetup" },
    { label: "관리비 설정", icon: Settings, page: "RepBillingSettings" },
    { label: "입금 계좌", icon: CreditCard, page: "RepBankAccount" },
    { label: "전체 관리비 현황", icon: BarChart3, page: "RepReportsTotalFee" },
    { label: "세대별 관리비", icon: Receipt, page: "RepReportsUnitFee" },
    { label: "세대별 납부 현황", icon: CheckCircle2, page: "RepReportsUnitPayments" },
    { label: "요금제 확인", icon: Receipt, page: "RepPlan" },
    { label: "대표자 변경", icon: Users, page: "RepRoleChange" },
  ];

  return (
    <RepLayout buildingId={buildingId} building={building} currentPage="RepDashboard">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(createPageUrl("MyBuildings"))}
            className="text-sm text-slate-600 hover:text-primary mb-3 flex items-center gap-1"
          >
            ← 내 건물 목록
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{building?.name}</h1>
                <p className="text-sm text-slate-600">대표자님 환영합니다</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="card-rounded border-0 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalUnits}</p>
                  <p className="text-xs text-slate-500 mt-0.5">총 세대</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-rounded border-0 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.invitedUnits}</p>
                  <p className="text-xs text-slate-500 mt-0.5">초대 완료</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-rounded border-0 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.unpaidCount}</p>
                  <p className="text-xs text-slate-500 mt-0.5">미납 세대</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-rounded border-0 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">
                    {stats.currentMonthTotal > 0 ? `${(stats.currentMonthTotal / 10000).toFixed(0)}만` : '-'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">이번달 총액</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-3 px-1">
            빠른 작업
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickActions.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card 
                  key={idx}
                  className="cursor-pointer hover:shadow-lg transition-all group card-rounded border-0 shadow-sm"
                  onClick={() => navigate(createPageUrl(item.page) + `?buildingId=${buildingId}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl bg-${item.color}-100 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 text-${item.color}-600`} />
                      </div>
                      <span className="font-semibold text-slate-800 flex-1 text-sm">{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </RepLayout>
  );
}