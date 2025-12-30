import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Save } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepBuildingSetup() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    address_detail: ""
  });

  useEffect(() => {
    if (building) {
      setFormData({
        name: building.name || "",
        address: building.address || "",
        address_detail: building.address_detail || ""
      });
    }
  }, [building]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Building.update(buildingId, formData);
      navigate(createPageUrl('RepDashboard') + `?buildingId=${buildingId}`);
    } catch (err) {
      console.error("Error saving:", err);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepBuildingSetup">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepBuildingSetup">
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
    <RepLayout buildingId={buildingId} building={building} currentPage="RepBuildingSetup">
      <div className="max-w-lg mx-auto px-4 py-6">
        <PageHeader
          title="건물 기본정보"
          subtitle="공동주택 정보를 수정합니다"
          backUrl={createPageUrl('RepDashboard') + `?buildingId=${buildingId}`}
        />

        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label>공동주택 이름 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 행복빌라 101동"
              />
            </div>

            <div className="space-y-2">
              <Label>주소</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="예: 서울시 강남구 테헤란로 123"
              />
            </div>

            <div className="space-y-2">
              <Label>상세 주소</Label>
              <Input
                value={formData.address_detail}
                onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
                placeholder="예: A동 전체"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('RepDashboard') + `?buildingId=${buildingId}`)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name || isSaving}
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