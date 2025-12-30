import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Loader2, Send, Home, Check, Phone } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepBillingSend() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const yearMonthParam = urlParams.get('yearMonth');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const selectedYearMonth = yearMonthParam || (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();
  
  const [billCycle, setBillCycle] = useState(null);
  const [units, setUnits] = useState([]);
  const [unitCharges, setUnitCharges] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);

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
        setUnitCharges([]);
        setIsLoadingData(false);
        return;
      }

      const cycle = cyclesData[0];
      setBillCycle(cycle);

      const chargesData = await base44.entities.UnitCharge.filter({ bill_cycle_id: cycle.id });
      setUnitCharges(chargesData);
      
      // Auto-select units with phone numbers that haven't been sent
      const toSelect = chargesData
        .filter(c => !c.is_sent)
        .map(c => c.unit_id)
        .filter(unitId => {
          const unit = unitsData.find(u => u.id === unitId);
          return unit?.tenant_phone && !unit.tenant_phone.includes("--");
        });
      setSelectedUnits(toSelect);
      
      setIsLoadingData(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoadingData(false);
    }
  };

  const handleToggleUnit = (unitId) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const handleSelectAll = () => {
    const selectableUnits = units
      .filter(u => u.tenant_phone && !u.tenant_phone.includes("--"))
      .map(u => u.id);
    
    if (selectedUnits.length === selectableUnits.length) {
      setSelectedUnits([]);
    } else {
      setSelectedUnits(selectableUnits);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    let successCount = 0;
    let failCount = 0;
    
    try {
      for (const unitId of selectedUnits) {
        const unit = units.find(u => u.id === unitId);
        const charge = unitCharges.find(c => c.unit_id === unitId);
        
        if (!unit || !charge) {
          failCount++;
          continue;
        }

        try {
          await base44.entities.UnitCharge.update(charge.id, {
            is_sent: true,
            sent_at: new Date().toISOString()
          });

          const billDetailUrl = `${window.location.origin}${createPageUrl(`TenantMyBills?buildingId=${buildingId}`)}`;
          const notificationBody = `[${building?.name}]\n${selectedYearMonth} 관리비 청구\n\n청구금액: ${charge.amount_total?.toLocaleString()}원\n납기일: 매월 ${building?.billing_due_day || 25}일\n\n입금계좌\n${building?.bank_name} ${building?.bank_account}\n예금주: ${building?.bank_holder}\n\n상세내역은 셀프빌 링크에서 확인하세요.\n${billDetailUrl}`;

          await base44.entities.NotificationLog.create({
            building_id: buildingId,
            event_type: "BILL_NOTICE",
            to_phone: unit.tenant_phone,
            title: `[${building?.name}] ${selectedYearMonth} 관리비 청구서`,
            body: notificationBody,
            status: "발송성공",
            event_ref_id: charge.id,
            sent_at: new Date().toISOString()
          });

          const existingPayment = await base44.entities.PaymentStatus.filter({
            unit_charge_id: charge.id
          });
          
          if (existingPayment.length === 0) {
            await base44.entities.PaymentStatus.create({
              unit_charge_id: charge.id,
              building_id: buildingId,
              unit_id: unitId,
              year_month: selectedYearMonth,
              status: "미납",
              charged_amount: charge.amount_total,
              paid_amount: 0
            });
          }
          
          successCount++;
        } catch (unitErr) {
          console.error("Error sending to unit:", unitErr);
          failCount++;
        }
      }

      await base44.entities.BillCycle.update(billCycle.id, {
        status: "sent"
      });

      if (failCount === 0) {
        alert(`✅ 청구서 발송 완료!\n${successCount}세대에 청구서가 성공적으로 발송되었습니다.`);
      } else {
        alert(`⚠️ 청구서 발송 완료\n성공: ${successCount}세대\n실패: ${failCount}세대`);
      }

      navigate(createPageUrl('RepDashboard') + `?buildingId=${buildingId}`);
    } catch (err) {
      console.error("Error sending:", err);
      alert("❌ 청구서 발송 중 오류가 발생했습니다.");
    }
    
    setIsSending(false);
  };

  if (isLoading || isLoadingData) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepBillingSend">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepBillingSend">
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

  const getChargeForUnit = (unitId) => {
    return unitCharges.find(c => c.unit_id === unitId);
  };

  const canSendUnit = (unit) => {
    return unit.tenant_phone && !unit.tenant_phone.includes("--");
  };

  const selectableCount = units.filter(canSendUnit).length;

  return (
    <RepLayout buildingId={buildingId} building={building} currentPage="RepBillingSend">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader
          title="청구서 발송"
          subtitle={`${selectedYearMonth} 관리비 청구서`}
          backUrl={createPageUrl('RepBillingUnitCharges') + `?buildingId=${buildingId}&yearMonth=${selectedYearMonth}`}
        />

        {unitCharges.length === 0 ? (
          <EmptyState
            icon={Send}
            title="발송할 청구서가 없습니다"
            description="먼저 세대별 청구 금액을 계산해주세요."
            actionLabel="세대별 청구 확인"
            onAction={() => navigate(createPageUrl(`RepBillingUnitCharges?buildingId=${buildingId}`))}
          />
        ) : (
          <>
            {/* Select All */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedUnits.length === selectableCount && selectableCount > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="font-medium text-slate-900">전체 선택</span>
                  </div>
                  <span className="text-sm text-slate-500">
                    {selectedUnits.length} / {selectableCount} 세대 선택
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Unit List */}
            <div className="space-y-3 mb-6">
              {units.map((unit) => {
                const charge = getChargeForUnit(unit.id);
                const canSend = canSendUnit(unit);
                const isSelected = selectedUnits.includes(unit.id);
                const isSent = charge?.is_sent;
                
                return (
                  <Card 
                    key={unit.id} 
                    className={`transition-all ${!canSend ? 'opacity-50' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleUnit(unit.id)}
                          disabled={!canSend || isSent}
                        />
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Home className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{getUnitDisplay(unit)}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            {unit.tenant_name && <span>{unit.tenant_name}</span>}
                            {canSend ? (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {unit.tenant_phone}
                              </span>
                            ) : (
                              <span className="text-red-500">번호 미등록</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {charge && (
                            <p className="font-bold text-slate-900">
                              {charge.amount_total?.toLocaleString()}원
                            </p>
                          )}
                          {isSent && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              발송완료
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Send Button */}
            <Card className="sticky bottom-4">
              <CardContent className="p-4">
                <Button
                  onClick={handleSend}
                  disabled={selectedUnits.length === 0 || isSending}
                  className="w-full"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      발송 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {selectedUnits.length}세대 청구서 발송
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-500 text-center mt-2">
                  선택한 세대에 MMS로 관리비 청구서가 발송됩니다.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </RepLayout>
  );
}