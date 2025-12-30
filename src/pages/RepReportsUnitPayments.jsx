import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Home, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepReportsUnitPayments() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [units, setUnits] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadData();
  }, [buildingId, selectedYear]);

  const loadData = async () => {
    if (!buildingId) return;
    setIsLoadingData(true);
    
    try {
      const [unitsData, paymentsData] = await Promise.all([
        base44.entities.Unit.filter({ building_id: buildingId, status: "active" }),
        base44.entities.PaymentStatus.filter({ building_id: buildingId })
      ]);

      setUnits(unitsData);
      setPayments(paymentsData.filter(p => p.year_month?.startsWith(String(selectedYear))));
      setIsLoadingData(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoadingData(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepReportsUnitPayments">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepReportsUnitPayments">
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

  const getUnitDisplay = (unit) => {
    return [unit.dong, unit.floor, unit.ho].filter(Boolean).join(" ") || "호수 미입력";
  };

  const getPaymentForUnitMonth = (unitId, month) => {
    const ym = `${selectedYear}-${String(month).padStart(2, '0')}`;
    return payments.find(p => p.unit_id === unitId && p.year_month === ym);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "완납":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "부분납":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "미납":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <span className="text-slate-300">-</span>;
    }
  };

  const getUnitStats = (unitId) => {
    const unitPayments = payments.filter(p => p.unit_id === unitId);
    return {
      total: unitPayments.length,
      paid: unitPayments.filter(p => p.status === "완납").length,
      partial: unitPayments.filter(p => p.status === "부분납").length,
      unpaid: unitPayments.filter(p => p.status === "미납").length
    };
  };

  return (
    <RepLayout buildingId={buildingId} building={building} currentPage="RepReportsUnitPayments">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PageHeader
          title="세대별 납부 현황"
          subtitle={`${selectedYear}년 세대별 납부 현황`}
          backUrl={createPageUrl('RepDashboard') + `?buildingId=${buildingId}`}
        />

        {/* Year Selector */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
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

        {/* Legend */}
        <Card className="mb-4">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>완납</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span>부분납</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span>미납</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {units.length === 0 ? (
          <EmptyState
            icon={Home}
            title="등록된 세대가 없습니다"
          />
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white">세대</TableHead>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <TableHead key={m} className="text-center min-w-12">{m}월</TableHead>
                    ))}
                    <TableHead className="text-center">완납률</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => {
                    const stats = getUnitStats(unit.id);
                    const paidRate = stats.total > 0 ? (stats.paid / stats.total * 100) : 0;
                    
                    return (
                      <TableRow key={unit.id}>
                        <TableCell className="sticky left-0 bg-white font-medium">
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-blue-600" />
                            <div>
                              <p>{getUnitDisplay(unit)}</p>
                              {unit.tenant_name && (
                                <p className="text-xs text-slate-500">{unit.tenant_name}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => {
                          const payment = getPaymentForUnitMonth(unit.id, month);
                          return (
                            <TableCell key={month} className="text-center">
                              {payment ? getStatusIcon(payment.status) : <span className="text-slate-200">-</span>}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <span className={`font-bold ${
                            paidRate >= 80 ? 'text-green-600' : 
                            paidRate >= 50 ? 'text-yellow-600' : 'text-red-500'
                          }`}>
                            {paidRate.toFixed(0)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </RepLayout>
  );
}