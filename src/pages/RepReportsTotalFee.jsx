import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepReportsTotalFee() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [billCycles, setBillCycles] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadData();
  }, [buildingId, selectedYear]);

  const loadData = async () => {
    if (!buildingId) return;
    setIsLoadingData(true);
    
    try {
      const [cyclesData, paymentsData] = await Promise.all([
        base44.entities.BillCycle.filter({ building_id: buildingId }),
        base44.entities.PaymentStatus.filter({ building_id: buildingId })
      ]);

      setBillCycles(cyclesData.filter(c => c.year === selectedYear));
      setPayments(paymentsData.filter(p => p.year_month?.startsWith(String(selectedYear))));
      setIsLoadingData(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoadingData(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepReportsTotalFee">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepReportsTotalFee">
        <div className="flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-slate-500">{error}</p>
            </CardContent>
          </Card>
        </div>
      </RepLayout>
    );
  }

  // Prepare chart data
  const chartData = [];
  for (let month = 1; month <= 12; month++) {
    const ym = `${selectedYear}-${String(month).padStart(2, '0')}`;
    const cycle = billCycles.find(c => c.year_month === ym);
    const monthPayments = payments.filter(p => p.year_month === ym);
    
    const charged = cycle?.total_amount || 0;
    const paid = monthPayments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
    
    chartData.push({
      month: `${month}월`,
      청구액: charged,
      수납액: paid
    });
  }

  // Calculate totals
  const totalCharged = billCycles.reduce((sum, c) => sum + (c.total_amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
  const collectionRate = totalCharged > 0 ? (totalPaid / totalCharged * 100) : 0;

  // Calculate trend (compare with previous month)
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthData = chartData[currentMonth - 1];
  const prevMonthData = chartData[currentMonth - 2];
  const trend = prevMonthData?.청구액 > 0 
    ? ((currentMonthData?.청구액 - prevMonthData?.청구액) / prevMonthData?.청구액 * 100)
    : 0;

  return (
    <RepLayout buildingId={buildingId} building={building} currentPage="RepReportsTotalFee">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <PageHeader
          title="전체 관리비 현황"
          subtitle={`${selectedYear}년 관리비 통계`}
          backUrl={createPageUrl('RepDashboard') + `?buildingId=${buildingId}`}
        />

        {/* Year Selector */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}년</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-500 mb-1">총 청구액</p>
              <p className="text-xl font-bold text-slate-900">
                {(totalCharged / 10000).toFixed(0)}만원
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-500 mb-1">총 수납액</p>
              <p className="text-xl font-bold text-green-600">
                {(totalPaid / 10000).toFixed(0)}만원
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-500 mb-1">수납률</p>
              <p className="text-xl font-bold text-blue-600">
                {collectionRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-500 mb-1">전월 대비</p>
              <div className="flex items-center gap-1">
                {trend >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
                <p className={`text-xl font-bold ${trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {Math.abs(trend).toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>월별 관리비 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                  />
                  <Tooltip 
                    formatter={(value) => `${value.toLocaleString()}원`}
                  />
                  <Legend />
                  <Bar dataKey="청구액" fill="#3b82f6" />
                  <Bar dataKey="수납액" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </RepLayout>
  );
}