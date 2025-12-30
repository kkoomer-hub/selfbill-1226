import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, Save, ChevronLeft, ChevronRight, Calendar, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepPaymentsManage() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [unitCharges, setUnitCharges] = useState([]);
  const [units, setUnits] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, [selectedDate, buildingId]);

  const loadData = async () => {
    if (!buildingId) return;
    
    try {
      const yearMonth = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
      
      const [charges, statuses, unitsData] = await Promise.all([
        base44.entities.UnitCharge.filter({
          building_id: buildingId,
          year_month: yearMonth
        }),
        base44.entities.PaymentStatus.filter({
          building_id: buildingId,
          year_month: yearMonth
        }),
        base44.entities.Unit.filter({
          building_id: buildingId,
          status: "active"
        })
      ]);

      setUnitCharges(charges);
      setPaymentStatuses(statuses);
      setUnits(unitsData);

      const initialFormData = {};
      charges.forEach(charge => {
        const status = statuses.find(s => s.unit_charge_id === charge.id);
        initialFormData[charge.id] = {
          status: status?.status || "미납",
          paid_amount: status?.paid_amount || 0,
          paid_at: status?.paid_at || "",
          memo: status?.memo || ""
        };
      });
      setFormData(initialFormData);
      setIsLoadingData(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoadingData(false);
    }
  };

  const updateField = (chargeId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [chargeId]: {
        ...prev[chargeId],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const yearMonth = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
      
      for (const charge of unitCharges) {
        const data = formData[charge.id];
        const existingStatus = paymentStatuses.find(s => s.unit_charge_id === charge.id);

        const statusData = {
          unit_charge_id: charge.id,
          building_id: buildingId,
          unit_id: charge.unit_id,
          year_month: yearMonth,
          status: data.status,
          charged_amount: charge.amount_total,
          paid_amount: data.paid_amount ? parseFloat(data.paid_amount) : 0,
          paid_at: data.paid_at || null,
          memo: data.memo || ""
        };

        if (existingStatus) {
          await base44.entities.PaymentStatus.update(existingStatus.id, statusData);
        } else {
          await base44.entities.PaymentStatus.create(statusData);
        }
      }

      alert("납부 현황이 저장되었습니다.");
      await loadData();
    } catch (err) {
      console.error("Error saving:", err);
    }
    setIsSaving(false);
  };

  const changeMonth = (delta) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  if (isLoading || isLoadingData) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepPaymentsManage">
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepPaymentsManage">
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
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

  const formatYearMonth = (date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const getUnitInfo = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? {
      name: unit.unit_name || `${unit.dong || ''}동 ${unit.ho || ''}호`.trim(),
      tenant: unit.tenant_name
    } : { name: '정보 없음', tenant: '' };
  };

  // 완납과 미완납 분리
  const paidCharges = unitCharges.filter(charge => formData[charge.id]?.status === "완납");
  const unpaidCharges = unitCharges.filter(charge => formData[charge.id]?.status !== "완납");

  return (
    <RepLayout buildingId={buildingId} building={building} currentPage="RepPaymentsManage">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">납부 현황 관리</h1>
          <p className="text-slate-500">세대별 관리비 납부 상태를 확인하고 관리합니다</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => changeMonth(-1)}
            className="rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold text-slate-900">{formatYearMonth(selectedDate)}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => changeMonth(1)}
            className="rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {unitCharges.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="청구 내역이 없습니다"
            description={`${formatYearMonth(selectedDate)} 관리비 청구 내역이 없습니다.`}
          />
        ) : (
          <>
            {/* 완납 세대 섹션 */}
            {paidCharges.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h2 className="font-semibold text-green-700">완납 ({paidCharges.length}세대)</h2>
                </div>
                <div className="space-y-3">
                  {paidCharges.map((charge) => {
                    const data = formData[charge.id] || {};
                    const unitInfo = getUnitInfo(charge.unit_id);
                    
                    return (
                      <Card key={charge.id} className="card-rounded border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="font-bold text-slate-900 mb-1">{unitInfo.name}</p>
                              <p className="text-sm text-slate-600">{unitInfo.tenant}</p>
                              <p className="text-sm text-slate-500 mt-1">
                                청구 금액: {charge.amount_total?.toLocaleString()}원
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-slate-500 block mb-1">납부 금액</label>
                                <Input
                                  type="number"
                                  value={data.paid_amount}
                                  onChange={(e) => updateField(charge.id, 'paid_amount', e.target.value)}
                                  placeholder="0"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 block mb-1">납부일</label>
                                <Input
                                  type="date"
                                  value={data.paid_at}
                                  onChange={(e) => updateField(charge.id, 'paid_at', e.target.value)}
                                  className="h-9"
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 미완납 세대 섹션 */}
            {unpaidCharges.length > 0 && (
              <div className="mb-6">
                <h2 className="font-semibold text-slate-700 mb-3">미완납 ({unpaidCharges.length}세대)</h2>
                <div className="space-y-3">
                  {unpaidCharges.map((charge) => {
                    const data = formData[charge.id] || {};
                    const unitInfo = getUnitInfo(charge.unit_id);
                    
                    return (
                      <Card key={charge.id} className="card-rounded">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="font-bold text-slate-900 mb-1">{unitInfo.name}</p>
                              <p className="text-sm text-slate-600">{unitInfo.tenant}</p>
                              <p className="text-sm text-slate-500 mt-1">
                                청구 금액: {charge.amount_total?.toLocaleString()}원
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-slate-500 block mb-1">납부 상태</label>
                                <Select
                                  value={data.status}
                                  onValueChange={(val) => updateField(charge.id, 'status', val)}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="미납">미납</SelectItem>
                                    <SelectItem value="부분납">부분납</SelectItem>
                                    <SelectItem value="완납">완납</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <label className="text-xs text-slate-500 block mb-1">납부 금액</label>
                                <Input
                                  type="number"
                                  value={data.paid_amount}
                                  onChange={(e) => updateField(charge.id, 'paid_amount', e.target.value)}
                                  placeholder="0"
                                  className="h-9"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-xs text-slate-500 block mb-1">납부일</label>
                              <Input
                                type="date"
                                value={data.paid_at}
                                onChange={(e) => updateField(charge.id, 'paid_at', e.target.value)}
                                className="h-9"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs text-slate-500 block mb-1">메모</label>
                              <Textarea
                                value={data.memo}
                                onChange={(e) => updateField(charge.id, 'memo', e.target.value)}
                                placeholder="메모 입력"
                                rows={1}
                                className="resize-none"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="sticky bottom-6 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="lg"
                className="bg-primary hover:bg-primary-dark text-white rounded-full font-semibold shadow-lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    최종 저장
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </RepLayout>
  );
}