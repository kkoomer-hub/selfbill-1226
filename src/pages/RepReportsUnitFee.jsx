import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Home, Calendar } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepReportsUnitFee() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [units, setUnits] = useState([]);
  const [unitCharges, setUnitCharges] = useState([]);

  useEffect(() => {
    loadData();
  }, [buildingId, selectedYear]);

  const loadData = async () => {
    if (!buildingId) return;
    setIsLoadingData(true);
    
    try {
      const [unitsData, chargesData] = await Promise.all([
        base44.entities.Unit.filter({ building_id: buildingId, status: "active" }),
        base44.entities.UnitCharge.filter({ building_id: buildingId })
      ]);

      setUnits(unitsData);
      setUnitCharges(chargesData.filter(c => c.year_month?.startsWith(String(selectedYear))));
      setIsLoadingData(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoadingData(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepReportsUnitFee">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepReportsUnitFee">
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

  const getChargeForUnitMonth = (unitId, month) => {
    const ym = `${selectedYear}-${String(month).padStart(2, '0')}`;
    return unitCharges.find(c => c.unit_id === unitId && c.year_month === ym);
  };

  const getUnitYearTotal = (unitId) => {
    return unitCharges
      .filter(c => c.unit_id === unitId)
      .reduce((sum, c) => sum + (c.amount_total || 0), 0);
  };

  return (
    <RepLayout buildingId={buildingId} building={building} currentPage="RepReportsUnitFee">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PageHeader
          title="세대별 관리비"
          subtitle={`${selectedYear}년 세대별 관리비 현황`}
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
                      <TableHead key={m} className="text-center min-w-20">{m}월</TableHead>
                    ))}
                    <TableHead className="text-center font-bold">합계</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="sticky left-0 bg-white font-medium">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-blue-600" />
                          {getUnitDisplay(unit)}
                        </div>
                      </TableCell>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => {
                        const charge = getChargeForUnitMonth(unit.id, month);
                        return (
                          <TableCell key={month} className="text-center text-sm">
                            {charge ? (
                              <span className="text-slate-700">
                                {(charge.amount_total / 1000).toFixed(0)}천
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-bold text-blue-600">
                        {(getUnitYearTotal(unit.id) / 10000).toFixed(1)}만
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </RepLayout>
  );
}