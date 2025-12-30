import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Home, Calculator, ChevronRight, Calendar } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepBillingUnitCharges() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const yearMonthParam = urlParams.get('yearMonth');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [selectedYearMonth, setSelectedYearMonth] = useState(() => {
    if (yearMonthParam) return yearMonthParam;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [billCycle, setBillCycle] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitCharges, setUnitCharges] = useState([]);

  useEffect(() => {
    loadData();
  }, [buildingId, selectedYearMonth]);

  const loadData = async () => {
    if (!buildingId) return;
    setIsLoadingData(true);
    
    try {
      const [cyclesData, unitsData] = await Promise.all([
        base44.entities.BillCycle.filter({ building_id: buildingId, year_month: selectedYearMonth }),
        base44.entities.Unit.filter({ building_id: buildingId, status: "active" })
      ]);

      setUnits(unitsData);

      if (cyclesData.length === 0) {
        setBillCycle(null);
        setBillItems([]);
        setUnitCharges([]);
        setIsLoadingData(false);
        return;
      }

      const cycle = cyclesData[0];
      setBillCycle(cycle);

      const [itemsData, chargesData] = await Promise.all([
        base44.entities.BillItem.filter({ bill_cycle_id: cycle.id }),
        base44.entities.UnitCharge.filter({ bill_cycle_id: cycle.id })
      ]);

      setBillItems(itemsData);
      setUnitCharges(chargesData);
      setIsLoadingData(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoadingData(false);
    }
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    try {
      // Delete existing charges
      for (const charge of unitCharges) {
        await base44.entities.UnitCharge.delete(charge.id);
      }

      const newCharges = [];

      // 항목 분류
      const commonItems = billItems.filter(item => item.type === "공용");
      const unitSpecificItems = billItems.filter(item => item.type === "세대별");

      // 공용 항목별로 정확한 분배를 위한 계산
      const itemAllocations = {};
      const billingMethod = building?.billing_method || "균등 배분";

      for (const item of commonItems) {
        const itemTotal = parseFloat(item.amount_total) || 0;
        
        if (billingMethod === "지분율에 의거 부과") {
          // 지분율 기준 분배
          itemAllocations[item.id] = units.map(unit => ({
            unitId: unit.id,
            amount: Math.round(itemTotal * ((unit.share_ratio || 0) / 100))
          }));
        } else {
          // 균등 분배
          const perUnit = Math.floor(itemTotal / units.length);
          const remainder = itemTotal - (perUnit * units.length);
          
          itemAllocations[item.id] = units.map((unit, idx) => ({
            unitId: unit.id,
            amount: perUnit + (idx < remainder ? 1 : 0)
          }));
        }
      }

      for (const unit of units) {
        const breakdown = [];
        let unitTotal = 0;

        // 공용 항목 적용
        for (const item of commonItems) {
          const allocation = itemAllocations[item.id]?.find(a => a.unitId === unit.id);
          if (allocation && allocation.amount > 0) {
            breakdown.push({ name: item.name, amount: allocation.amount });
            unitTotal += allocation.amount;
          }
        }

        // 세대별 항목 적용
        for (const item of unitSpecificItems) {
          const targetUnitIds = item.target_unit_ids || [];
          if (targetUnitIds.includes(unit.id)) {
            let amount = 0;
            
            // 변동 항목인 경우 unit_amounts에서 금액 가져오기
            if (item.unit_amounts) {
              try {
                const unitAmounts = JSON.parse(item.unit_amounts);
                amount = parseInt(unitAmounts[unit.id]) || 0;
              } catch (e) {
                console.error("Error parsing unit_amounts:", e);
              }
            } else {
              // 고정 항목인 경우 대상 세대 수로 균등 분배
              const itemTotal = parseFloat(item.amount_total) || 0;
              const targetCount = targetUnitIds.length;
              amount = targetCount > 0 ? Math.round(itemTotal / targetCount) : 0;
            }
            
            if (amount > 0) {
              breakdown.push({ name: item.name, amount });
              unitTotal += amount;
            }
          }
        }

        const lateFeeRate = building?.late_fee_rate_percent || 0;
        const lateFeeAmount = Math.round(unitTotal * (lateFeeRate / 100));

        const charge = await base44.entities.UnitCharge.create({
          bill_cycle_id: billCycle.id,
          building_id: buildingId,
          unit_id: unit.id,
          year_month: selectedYearMonth,
          amount_total: unitTotal,
          breakdown_json: JSON.stringify(breakdown),
          late_fee_amount: lateFeeAmount,
          after_due_amount: unitTotal + lateFeeAmount,
          is_sent: false
        });

        newCharges.push({ ...charge, unit });
      }

      setUnitCharges(newCharges);
    } catch (err) {
      console.error("Error calculating:", err);
    }
    
    setIsCalculating(false);
  };

  if (isLoading || isLoadingData) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepBillingUnitCharges">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepBillingUnitCharges">
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

  // Generate year-month options
  const yearMonthOptions = [];
  const now = new Date();
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    yearMonthOptions.push(ym);
  }

  const getUnitDisplay = (unit) => {
    return [unit.dong, unit.floor, unit.ho].filter(Boolean).join(" ") || "호수 미입력";
  };

  const getChargeForUnit = (unitId) => {
    return unitCharges.find(c => c.unit_id === unitId);
  };

  return (
    <RepLayout buildingId={buildingId} building={building} currentPage="RepBillingUnitCharges">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader
          title="세대별 청구 확인"
          subtitle="세대별 관리비를 확인합니다"
          backUrl={createPageUrl('RepDashboard') + `?buildingId=${buildingId}`}
        />

        {/* Month Selector */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <Select value={selectedYearMonth} onValueChange={setSelectedYearMonth}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearMonthOptions.map(ym => (
                      <SelectItem key={ym} value={ym}>{ym}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCalculate} 
                disabled={!billCycle || isCalculating || (building?.billing_method === "지분율에 의거 부과" && Math.abs(units.reduce((sum, u) => sum + (u.share_ratio || 0), 0) - 100) > 0.1)}
              >
                {isCalculating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4 mr-2" />
                )}
                {unitCharges.length > 0 ? "재계산" : "계산하기"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {building?.billing_method === "지분율에 의거 부과" && Math.abs(units.reduce((sum, u) => sum + (u.share_ratio || 0), 0) - 100) > 0.1 && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-900">지분율 합계가 100%가 아닙니다</p>
                  <p className="text-xs text-red-700 mt-1">
                    현재 지분율 합계: {units.reduce((sum, u) => sum + (u.share_ratio || 0), 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    세대 목록에서 지분율을 수정하여 합계를 100%로 맞춰주세요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!billCycle ? (
          <EmptyState
            icon={Calculator}
            title="관리비 입력이 필요합니다"
            description="먼저 월별 관리비를 입력해주세요."
            actionLabel="관리비 입력"
            onAction={() => navigate(createPageUrl('RepBillingMonthlyEdit') + `?buildingId=${buildingId}`)}
          />
        ) : units.length === 0 ? (
          <EmptyState
            icon={Home}
            title="등록된 세대가 없습니다"
            description="먼저 세대를 등록해주세요."
            actionLabel="세대 등록"
            onAction={() => navigate(createPageUrl('RepUnits') + `?buildingId=${buildingId}`)}
          />
        ) : (
          <>
            {/* Summary */}
            {unitCharges.length > 0 && (
              <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                <CardContent className="pt-5 pb-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-600">총 청구 금액</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {unitCharges.reduce((sum, c) => sum + (c.amount_total || 0), 0).toLocaleString()}원
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">청구 세대 수</p>
                      <p className="text-2xl font-bold text-slate-900">{unitCharges.length}세대</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Unit Charges List */}
            <div className="space-y-3">
              {units.map((unit) => {
                const charge = getChargeForUnit(unit.id);
                
                return (
                  <Card key={unit.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Home className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{getUnitDisplay(unit)}</p>
                            {unit.tenant_name && (
                              <p className="text-sm text-slate-500">{unit.tenant_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {charge ? (
                            <>
                              <p className="text-lg font-bold text-slate-900">
                                {charge.amount_total?.toLocaleString()}원
                              </p>
                              {charge.late_fee_amount > 0 && (
                                <p className="text-xs text-slate-500">
                                  (연체 시: {charge.after_due_amount?.toLocaleString()}원)
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-slate-400">미계산</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Actions */}
            {unitCharges.length > 0 && (
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl('RepBillingMonthlyEdit') + `?buildingId=${buildingId}`)}
                  className="flex-1"
                >
                  관리비 수정
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl('RepBillingSend') + `?buildingId=${buildingId}&yearMonth=${selectedYearMonth}`)}
                  className="flex-1"
                  disabled={building?.billing_method === "지분율에 의거 부과" && Math.abs(units.reduce((sum, u) => sum + (u.share_ratio || 0), 0) - 100) > 0.1}
                >
                  청구서 발송
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </RepLayout>
  );
}