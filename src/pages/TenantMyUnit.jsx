import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, Save, Home, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import TenantLayout from '@/components/common/TenantLayout';

export default function TenantMyUnit() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, user, building, membership, error } = useBuildingAuth(buildingId, "입주자");
  const [unit, setUnit] = useState(null);
  const [isLoadingUnit, setIsLoadingUnit] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    tenant_email: "",
    is_owner: false,
    residents_count: "",
    move_in_date: "",
    car_count: "",
    car_numbers: []
  });

  useEffect(() => {
    loadUnit();
  }, [membership]);

  const loadUnit = async () => {
    if (!membership?.unit_id) return;
    try {
      const units = await base44.entities.Unit.filter({ id: membership.unit_id });
      if (units.length > 0) {
        const unitData = units[0];
        setUnit(unitData);
        setFormData({
          tenant_email: unitData.tenant_email || "",
          is_owner: unitData.is_owner || false,
          residents_count: unitData.residents_count || "",
          move_in_date: unitData.move_in_date || "",
          car_count: unitData.car_count || "",
          car_numbers: unitData.car_numbers || []
        });
      }
      setIsLoadingUnit(false);
    } catch (err) {
      console.error("Error loading unit:", err);
      setIsLoadingUnit(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Unit.update(unit.id, {
        ...formData,
        residents_count: formData.residents_count ? parseInt(formData.residents_count) : null,
        car_count: formData.car_count ? parseInt(formData.car_count) : null,
        needs_review: true
      });
      alert("정보가 저장되었습니다. 대표자 확인 후 최종 반영됩니다.");
      await loadUnit();
    } catch (err) {
      console.error("Error saving:", err);
    }
    setIsSaving(false);
  };

  const handleCarNumberChange = (index, value) => {
    const newCarNumbers = [...formData.car_numbers];
    newCarNumbers[index] = value;
    setFormData({ ...formData, car_numbers: newCarNumbers });
  };

  const addCarNumber = () => {
    setFormData({ ...formData, car_numbers: [...formData.car_numbers, ""] });
  };

  const removeCarNumber = (index) => {
    const newCarNumbers = formData.car_numbers.filter((_, i) => i !== index);
    setFormData({ ...formData, car_numbers: newCarNumbers });
  };

  if (isLoading || isLoadingUnit) {
    return (
      <TenantLayout buildingId={buildingId} building={building} currentPage="TenantMyUnit">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </TenantLayout>
    );
  }

  if (error) {
    return (
      <TenantLayout buildingId={buildingId} building={building} currentPage="TenantMyUnit">
        <div className="flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">접근 오류</h2>
              <p className="text-slate-500">{error}</p>
            </CardContent>
          </Card>
        </div>
      </TenantLayout>
    );
  }

  if (!unit) {
    return (
      <TenantLayout buildingId={buildingId} building={building} currentPage="TenantMyUnit">
        <div className="flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">세대 정보 없음</h2>
              <p className="text-slate-500">연결된 세대 정보를 찾을 수 없습니다.</p>
            </CardContent>
          </Card>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout buildingId={buildingId} building={building} currentPage="TenantMyUnit">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader
          title="나의 입주 현황"
          subtitle="세대 정보를 확인하고 추가 정보를 입력합니다"
          backUrl={createPageUrl('TenantDashboard') + `?buildingId=${buildingId}`}
        />

        {unit.needs_review && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-900">대표자 확인 대기 중</p>
                  <p className="text-sm text-yellow-700 mt-1">입력하신 정보가 대표자 확인을 기다리고 있습니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 card-rounded">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              세대 기본 정보 (읽기 전용)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-500">공동주택</Label>
                <p className="font-medium text-slate-900 mt-1">{building?.name}</p>
              </div>
              <div>
                <Label className="text-slate-500">동/호수</Label>
                <p className="font-medium text-slate-900 mt-1">{unit.unit_name}</p>
              </div>
              {unit.floor && (
                <div>
                  <Label className="text-slate-500">층</Label>
                  <p className="font-medium text-slate-900 mt-1">{unit.floor}</p>
                </div>
              )}
              <div>
                <Label className="text-slate-500">입주자 이름</Label>
                <p className="font-medium text-slate-900 mt-1">{unit.tenant_name}</p>
              </div>
              <div>
                <Label className="text-slate-500">연락처</Label>
                <p className="font-medium text-slate-900 mt-1">{unit.tenant_phone}</p>
              </div>
              {building?.billing_method === "by_share_ratio" && unit.share_ratio && (
                <div>
                  <Label className="text-slate-500">관리비 배분 비율</Label>
                  <p className="font-medium text-primary mt-1">{unit.share_ratio}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-rounded">
          <CardHeader>
            <CardTitle>추가 정보 입력</CardTitle>
            <p className="text-sm text-slate-500">입주자가 직접 입력하는 정보입니다</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input
                type="email"
                value={formData.tenant_email}
                onChange={(e) => setFormData({ ...formData, tenant_email: e.target.value })}
                placeholder="example@email.com"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>자가 여부</Label>
              <Switch
                checked={formData.is_owner}
                onCheckedChange={(checked) => setFormData({ ...formData, is_owner: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>거주 인원</Label>
              <Input
                type="number"
                value={formData.residents_count}
                onChange={(e) => setFormData({ ...formData, residents_count: e.target.value })}
                placeholder="예: 4"
              />
            </div>

            <div className="space-y-2">
              <Label>입주일</Label>
              <Input
                type="date"
                value={formData.move_in_date}
                onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>차량 대수</Label>
              <Input
                type="number"
                value={formData.car_count}
                onChange={(e) => setFormData({ ...formData, car_count: e.target.value })}
                placeholder="예: 2"
              />
            </div>

            <div className="space-y-3">
              <Label>차량 번호</Label>
              {formData.car_numbers.map((carNumber, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={carNumber}
                    onChange={(e) => handleCarNumberChange(index, e.target.value)}
                    placeholder="예: 12가3456"
                  />
                  <Button
                    variant="outline"
                    onClick={() => removeCarNumber(index)}
                  >
                    삭제
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addCarNumber}
                className="w-full"
              >
                + 차량 번호 추가
              </Button>
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('TenantDashboard') + `?buildingId=${buildingId}`)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-full font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TenantLayout>
  );
}