import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, Plus, Loader2, Home, Phone, Trash2, Edit2 } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import PhoneInput from '@/components/common/PhoneInput';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepUnits() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [units, setUnits] = useState([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    dong: "",
    ho: "",
    floor: "",
    tenant_name: "",
    phone1: "010",
    phone2: "",
    phone3: "",
    share_ratio: ""
  });

  useEffect(() => {
    loadUnits();
  }, [buildingId]);

  const totalShareRatio = units.reduce((sum, u) => sum + (u.share_ratio || 0), 0);

  const loadUnits = async () => {
    console.log("Loading units for buildingId:", buildingId);
    if (!buildingId) {
      console.warn("No buildingId provided in URL");
      return;
    }
    try {
      const data = await base44.entities.Unit.filter({
        building_id: buildingId
      });
      console.log("Raw units data:", data);
      setUnits(data.filter(u => u.status !== "inactive"));
      setIsLoadingUnits(false);
    } catch (err) {
      console.error("Error loading units:", err);
      setIsLoadingUnits(false);
    }
  };

  const updateBuildingUnitsCount = async () => {
    const activeUnits = await base44.entities.Unit.filter({
      building_id: buildingId,
      status: "active"
    });
    const count = activeUnits.length;
    const monthlyFee = count * 2900;
    
    await base44.entities.Building.update(buildingId, {
      building_units_count: count,
      billing_monthly_fee_krw: monthlyFee
    });
  };

  const handleOpenDialog = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      const phoneParts = (unit.tenant_phone || "010--").split('-');
      setFormData({
        dong: unit.dong || "",
        ho: unit.ho || "",
        floor: unit.floor || "",
        tenant_name: unit.tenant_name || "",
        phone1: phoneParts[0] || "010",
        phone2: phoneParts[1] || "",
        phone3: phoneParts[2] || "",
        share_ratio: unit.share_ratio || ""
      });
    } else {
      setEditingUnit(null);
      setFormData({
        dong: "",
        ho: "",
        floor: "",
        tenant_name: "",
        phone1: "010",
        phone2: "",
        phone3: "",
        share_ratio: ""
      });
    }
    setShowDialog(true);
  };

  const validateShareRatio = async () => {
    if (building?.billing_method !== "지분율에 의거 부과") return true;
    
    const allUnits = await base44.entities.Unit.filter({
      building_id: buildingId,
      status: "active"
    });
    
    let total = 0;
    for (const unit of allUnits) {
      if (editingUnit && unit.id === editingUnit.id) {
        total += parseFloat(formData.share_ratio) || 0;
      } else {
        total += unit.share_ratio || 0;
      }
    }
    
    if (!editingUnit) {
      total += parseFloat(formData.share_ratio) || 0;
    }
    
    if (Math.abs(total - 100) > 0.1) {
      const proceed = confirm("지분율 합계가 100%가 아닙니다.\n\n현재 합계: " + total.toFixed(1) + "%\n\n그래도 저장하시겠습니까?\n(청구서 발송은 100%가 되어야 가능합니다)");
      return proceed;
    }
    
    return true;
  };

    const handleSave = async () => {
    if (!buildingId || buildingId === 'null') {
      alert("건물 정보가 올바르지 않아 저장할 수 없습니다. 새로고침 후 다시 시도해주세요.");
      return;
    }

    // Validate phone format
    if (!formData.phone1 || !formData.phone2 || !formData.phone3 || 
        formData.phone1.length < 3 || 
        formData.phone2.length < 3 || formData.phone2.length > 4 || 
        formData.phone3.length !== 4) {
      alert("올바른 전화번호 형식으로 입력해주세요. (예: 010-1234-5678)");
      return;
    }

    setIsSaving(true);
    try {
      if (!await validateShareRatio()) {
        setIsSaving(false);
        return;
      }

      const tenant_phone = `${formData.phone1}-${formData.phone2}-${formData.phone3}`;
      const unit_name = [formData.dong && `${formData.dong}동`, formData.ho && `${formData.ho}호`].filter(Boolean).join(" ");
      
      const saveData = {
        name: unit_name || formData.ho, // Mandatory field in DB
        dong: formData.dong,
        ho: formData.ho,
        floor: formData.floor,
        unit_name: unit_name || formData.ho,
        tenant_name: formData.tenant_name,
        tenant_phone,
        building_id: buildingId,
        share_ratio: formData.share_ratio ? parseFloat(formData.share_ratio) : null,
        status: "active"
      };

      console.log("Saving unit with data:", saveData);

      if (editingUnit) {
        await base44.entities.Unit.update(editingUnit.id, saveData);
      } else {
        await base44.entities.Unit.create(saveData);
      }
      
      console.log("Unit saved successfully, updating counts...");
      await updateBuildingUnitsCount();
      await loadUnits();
      setShowDialog(false);
      console.log("Dialog closed and units reloaded.");
    } catch (err) {
      console.error("Error in handleSave:", err);
      alert("저장 중 오류가 발생했습니다: " + (err.message || "알 수 없는 오류"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (unitId) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    
    try {
      await base44.entities.Unit.update(unitId, { status: "inactive" });
      await updateBuildingUnitsCount();
      await loadUnits();
    } catch (err) {
      console.error("Error deleting unit:", err);
    }
  };

  if (isLoading || isLoadingUnits) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepUnits">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepUnits">
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

  return (
    <RepLayout buildingId={buildingId} building={building} currentPage="RepUnits">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader
          title="세대 목록"
          subtitle={`총 ${units.length}세대`}
          backUrl={createPageUrl('RepDashboard') + `?buildingId=${buildingId}`}
          actions={
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              세대 추가
            </Button>
          }
        />

        {units.length === 0 ? (
          <EmptyState
            icon={Home}
            title="등록된 세대가 없습니다"
            description="세대를 추가하여 관리비 부과를 시작하세요."
            actionLabel="세대 추가"
            onAction={() => handleOpenDialog()}
          />
        ) : (
          <>
            {building?.billing_method === "지분율에 의거 부과" && (
              <Card className="mb-4 bg-blue-50 border-blue-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">지분율 진행현황</span>
                    <span className={`text-lg font-bold ${Math.abs(totalShareRatio - 100) < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalShareRatio.toFixed(1)}% / 100%
                    </span>
                  </div>
                  {Math.abs(totalShareRatio - 100) > 0.1 && (
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ 지분율 합계가 100%가 되어야 청구서를 발행할 수 있습니다.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            <div className="space-y-3">
            {units.map((unit) => (
              <Card key={unit.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Home className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {unit.unit_name || "호수 미입력"}
                        </p>
                        {unit.tenant_name && (
                          <p className="text-sm text-slate-500">
                            {unit.tenant_name}
                            {unit.tenant_phone && ` · ${unit.tenant_phone}`}
                          </p>
                        )}
                        {unit.floor && (
                          <p className="text-xs text-slate-400">{unit.floor}</p>
                        )}
                        {building?.billing_method === "지분율에 의거 부과" && unit.share_ratio && (
                          <p className="text-xs text-primary font-semibold">배분 비율: {unit.share_ratio}%</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(unit)}
                      >
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(unit.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUnit ? "세대 수정" : "세대 추가"}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>동</Label>
                  <Input
                    value={formData.dong}
                    onChange={(e) => setFormData({ ...formData, dong: e.target.value })}
                    placeholder="101"
                  />
                </div>
                <div className="space-y-2">
                  <Label>호수 *</Label>
                  <Input
                    value={formData.ho}
                    onChange={(e) => setFormData({ ...formData, ho: e.target.value })}
                    placeholder="302"
                  />
                </div>
                <div className="space-y-2">
                  <Label>층</Label>
                  <Input
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="3"
                  />
                </div>
              </div>

              {building?.billing_method === "지분율에 의거 부과" && (
                <div className="space-y-2">
                  <Label>관리비 배분 비율 (%) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.share_ratio}
                    onChange={(e) => setFormData({ ...formData, share_ratio: e.target.value })}
                    placeholder="예: 10.5"
                  />
                  <p className="text-xs text-slate-500">
                    모든 세대의 배분 비율 합계가 100%가 되어야 합니다
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-slate-700 mb-3">입주자 정보</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>입주자 이름 *</Label>
                    <Input
                      value={formData.tenant_name}
                      onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                      placeholder="홍길동"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>전화번호 *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={formData.phone1}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setFormData({ ...formData, phone1: val });
                        }}
                        className="w-20"
                        placeholder="010"
                      />
                      <span>-</span>
                      <Input
                        type="text"
                        value={formData.phone2}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setFormData({ ...formData, phone2: val });
                        }}
                        className="w-24"
                        placeholder="1234"
                      />
                      <span>-</span>
                      <Input
                        type="text"
                        value={formData.phone3}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setFormData({ ...formData, phone3: val });
                        }}
                        className="w-24"
                        placeholder="5678"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={!formData.ho || !formData.tenant_name || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RepLayout>
  );
}