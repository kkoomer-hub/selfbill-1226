import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import TenantLayout from '@/components/common/TenantLayout';

export default function TenantMyPayments() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, building, membership, error } = useBuildingAuth(buildingId, "입주자");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payments, setPayments] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedYear, membership]);

  const loadData = async () => {
    if (!membership?.unit_id) return;
    
    try {
      const allPayments = await base44.entities.PaymentStatus.filter({
        building_id: buildingId,
        unit_id: membership.unit_id
      });

      const yearPayments = allPayments.filter(p => {
        const year = parseInt(p.year_month?.split('-')[0] || '0');
        return year === selectedYear;
      });

      setPayments(yearPayments.sort((a, b) => b.year_month.localeCompare(a.year_month)));
      setIsLoadingData(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoadingData(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      "미납": { className: "bg-red-100 text-red-700", icon: XCircle },
      "부분납": { className: "bg-yellow-100 text-yellow-700", icon: Clock },
      "완납": { className: "bg-green-100 text-green-700", icon: CheckCircle2 }
    };
    const { className, icon: Icon } = config[status] || config["미납"];
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (isLoading || isLoadingData) {
    return (
      <TenantLayout buildingId={buildingId} building={building} currentPage="TenantMyPayments">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </TenantLayout>
    );
  }

  if (error) {
    return (
      <TenantLayout buildingId={buildingId} building={building} currentPage="TenantMyPayments">
        <div className="flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-slate-500">{error}</p>
            </CardContent>
          </Card>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout buildingId={buildingId} building={building} currentPage="TenantMyPayments">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader
          title="나의 납부 현황"
          subtitle="월별 관리비 납부 내역을 확인합니다"
          backUrl={createPageUrl('TenantDashboard') + `?buildingId=${buildingId}`}
        />

        <div className="mb-6">
          <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(parseInt(val))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>{year}년</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {payments.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="납부 내역이 없습니다"
            description={`${selectedYear}년도 납부 내역이 없습니다.`}
          />
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <Card
                key={payment.id}
                className="card-rounded hover:shadow-lg transition-all cursor-pointer"
                onClick={() => {
                  const [year, month] = payment.year_month.split('-');
                  navigate(createPageUrl('TenantMyBills') + `?buildingId=${buildingId}`);
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-bold text-slate-900">
                          {payment.year_month}
                        </p>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600">
                          청구 금액: {payment.charged_amount?.toLocaleString()}원
                        </p>
                        {payment.paid_amount > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            납부 금액: {payment.paid_amount?.toLocaleString()}원
                          </p>
                        )}
                        {payment.paid_at && (
                          <p className="text-xs text-slate-400">
                            납부일: {new Date(payment.paid_at).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
}