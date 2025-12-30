import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, Home, Receipt, CreditCard, 
  ChevronRight, AlertCircle, CheckCircle2, Clock,
  FileText
} from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import TenantLayout from '@/components/common/TenantLayout';

export default function TenantDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, user, building, membership, error } = useBuildingAuth(buildingId, "입주자");
  const [unit, setUnit] = useState(null);
  const [latestCharge, setLatestCharge] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!membership?.unit_id || isLoading) return;
      
      try {
        // Load unit info
        const units = await base44.entities.Unit.filter({ id: membership.unit_id });
        if (units.length > 0) {
          setUnit(units[0]);
        }

        // Load latest charge
        const charges = await base44.entities.UnitCharge.filter({
          unit_id: membership.unit_id
        });
        if (charges.length > 0) {
          const sorted = charges.sort((a, b) => b.year_month.localeCompare(a.year_month));
          setLatestCharge(sorted[0]);

          // Load payment status for latest charge
          const payments = await base44.entities.PaymentStatus.filter({
            unit_charge_id: sorted[0].id
          });
          if (payments.length > 0) {
            setPaymentStatus(payments[0]);
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }
    loadData();
  }, [membership, isLoading]);

  const getUnitDisplay = () => {
    if (!unit) return "-";
    const parts = [];
    if (unit.dong) parts.push(unit.dong);
    if (unit.floor) parts.push(unit.floor);
    if (unit.ho) parts.push(unit.ho);
    return parts.join(" ") || "-";
  };

  const menuItems = [
    { 
      label: "내 세대 정보", 
      icon: Home, 
      page: "TenantMyUnit", 
      color: "blue",
      description: "세대 정보 확인 및 수정"
    },
    { 
      label: "관리비 청구서", 
      icon: Receipt, 
      page: "TenantMyBills", 
      color: "purple",
      description: "월별 관리비 청구서 확인"
    },
    { 
      label: "납부 현황", 
      icon: CreditCard, 
      page: "TenantMyPayments", 
      color: "green",
      description: "납부 내역 조회"
    },
  ];

  if (isLoading) {
    return (
      <TenantLayout buildingId={buildingId} building={building} currentPage="TenantDashboard">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </TenantLayout>
    );
  }

  if (error) {
    return (
      <TenantLayout buildingId={buildingId} building={building} currentPage="TenantDashboard">
        <div className="flex items-center justify-center p-4">
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
      </TenantLayout>
    );
  }

  return (
    <TenantLayout buildingId={buildingId} building={building} currentPage="TenantDashboard">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(createPageUrl("MyBuildings"))}
            className="text-sm text-slate-600 hover:text-primary mb-3 flex items-center gap-1"
          >
            ← 내 건물 목록
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{building?.name}</h1>
              <p className="text-sm text-slate-600">{getUnitDisplay()}</p>
            </div>
          </div>
        </div>

        {/* Current Month Summary */}
        {latestCharge && (
          <Card className="mb-6 bg-gradient-to-br from-primary-light/20 to-primary/10 border-primary-light card-rounded border-0 shadow-md">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-primary font-semibold">
                  {latestCharge.year_month} 관리비
                </span>
                {paymentStatus && (
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    paymentStatus.status === "완납" 
                      ? "bg-green-100 text-green-700"
                      : paymentStatus.status === "부분납"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {paymentStatus.status}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {latestCharge.amount_total?.toLocaleString()}<span className="text-2xl text-slate-600">원</span>
              </p>
              {building?.due_day && (
                <p className="text-sm text-slate-600 mt-3">
                  납기일: 매월 {building.due_day}일
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {!latestCharge && (
          <Card className="mb-6">
            <CardContent className="py-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">아직 발송된 관리비 청구서가 없습니다.</p>
            </CardContent>
          </Card>
        )}

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card 
                key={idx}
                className="cursor-pointer hover:shadow-lg transition-all group card-rounded border-0 shadow-sm"
                onClick={() => navigate(createPageUrl(item.page) + `?buildingId=${buildingId}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-${item.color}-100 flex items-center justify-center`}>
                      <Icon className={`w-7 h-7 text-${item.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bank Account Info */}
        {building?.bank_name && (
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">입금 계좌</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-slate-900">
                {building.bank_name} {building.bank_account}
              </p>
              <p className="text-sm text-slate-500">
                예금주: {building.bank_holder}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TenantLayout>
  );
}