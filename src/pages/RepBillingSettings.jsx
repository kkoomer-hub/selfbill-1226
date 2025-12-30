import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Save } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepBillingSettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    billing_method: "",
    billing_period_type: "월 단위",
    billing_period_start: 1,
    billing_period_end: null,
    billing_due_day: 10,
    late_fee_rate_percent: 2.0
  });

  useEffect(() => {
    if (building) {
      setFormData({
        billing_method: building.billing_method || "",
        billing_period_type: building.billing_period_type || "월 단위",
        billing_period_start: building.billing_period_start || 1,
        billing_period_end: building.billing_period_end || null,
        billing_due_day: building.billing_due_day || 10,
        late_fee_rate_percent: building.late_fee_rate_percent || 2.0
      });
    }
  }, [building]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Building.update(buildingId, formData);
      navigate(createPageUrl(`RepDashboard?buildingId=${buildingId}`));
    } catch (err) {
      console.error("Error saving:", err);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepBillingSettings">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepBillingSettings">
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
    <RepLayout buildingId={buildingId} building={building} currentPage="RepBillingSettings">
      <div className="max-w-lg mx-auto px-4 py-6">
        <PageHeader
          title="관리비 설정"
          subtitle="부과 방식, 납기일, 연체율을 설정합니다"
          backUrl={createPageUrl('RepDashboard') + `?buildingId=${buildingId}`}
        />

        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-3">
              <Label className="text-base font-semibold">관리비 부과 방식 *</Label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="radio"
                    name="billing_method"
                    value="per_unit_equal"
                    checked={formData.billing_method === "per_unit_equal"}
                    onChange={(e) => setFormData({...formData, billing_method: e.target.value})}
                    className="w-4 h-4 mt-1 text-primary"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">세대별 균등 부과</div>
                    <div className="text-sm text-slate-500 mt-1">모든 세대에 동일한 금액을 부과합니다</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="radio"
                    name="billing_method"
                    value="by_share_ratio"
                    checked={formData.billing_method === "by_share_ratio"}
                    onChange={(e) => setFormData({...formData, billing_method: e.target.value})}
                    className="w-4 h-4 mt-1 text-primary"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">지분율에 의거 부과</div>
                    <div className="text-sm text-slate-500 mt-1">각 세대의 관리비 배분 비율(%)에 따라 부과합니다</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>부과 기간 시작일</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.billing_period_start}
                    onChange={(e) => setFormData({ ...formData, billing_period_start: parseInt(e.target.value) || 1 })}
                    className="w-20"
                  />
                  <span className="text-slate-500 text-sm">일</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>부과 기간 종료일</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.billing_period_end || ""}
                    onChange={(e) => setFormData({ ...formData, billing_period_end: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="말일"
                    className="w-20"
                  />
                  <span className="text-slate-500 text-sm">일</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>납입 기일 (매월)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={formData.billing_due_day}
                  onChange={(e) => setFormData({ ...formData, billing_due_day: parseInt(e.target.value) || 10 })}
                  className="w-24"
                />
                <span className="text-slate-500">일</span>
              </div>
              <p className="text-xs text-slate-500">
                매월 관리비를 납부해야 하는 날짜
              </p>
            </div>

            <div className="space-y-2">
              <Label>연체료율 (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={20}
                  step={0.1}
                  value={formData.late_fee_rate_percent}
                  onChange={(e) => setFormData({ ...formData, late_fee_rate_percent: parseFloat(e.target.value) || 0 })}
                  className="w-24"
                />
                <span className="text-slate-500">%</span>
              </div>
              <p className="text-xs text-slate-500">
                납기일 이후 부과되는 연체료율
              </p>
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl(`RepDashboard?buildingId=${buildingId}`))}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
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
    </RepLayout>
  );
}