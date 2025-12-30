import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Save, CreditCard } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행",
  "기업은행", "SC제일은행", "카카오뱅크", "토스뱅크", "케이뱅크",
  "새마을금고", "신협", "우체국", "수협", "지방은행"
];

export default function RepBankAccount() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: "",
    bank_account_holder: "",
    bank_account_number: ""
  });

  useEffect(() => {
    if (building) {
      setFormData({
        bank_name: building.bank_name || "",
        bank_account_holder: building.bank_holder || "",
        bank_account_number: building.bank_account || ""
      });
    }
  }, [building]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Building.update(buildingId, {
        bank_name: formData.bank_name,
        bank_holder: formData.bank_account_holder,
        bank_account: formData.bank_account_number
      });
      alert("입금 계좌 정보가 저장되었습니다.");
      navigate(createPageUrl(`RepDashboard?buildingId=${buildingId}`));
    } catch (err) {
      console.error("Error saving:", err);
      alert("저장 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepBankAccount">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepBankAccount">
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
    <RepLayout buildingId={buildingId} building={building} currentPage="RepBankAccount">
      <div className="max-w-lg mx-auto px-4 py-6">
        <PageHeader
          title="입금 계좌"
          subtitle="입주자가 관리비를 입금할 계좌를 등록합니다"
          backUrl={createPageUrl('RepDashboard') + `?buildingId=${buildingId}`}
        />

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg mb-6">
              <CreditCard className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium text-slate-900">관리비 입금 계좌</p>
                <p className="text-sm text-slate-500">관리비 청구서에 표시됩니다</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label>은행</Label>
                <Select
                  value={formData.bank_name}
                  onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="은행 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANKS.map((bank) => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>예금주</Label>
                <Input
                  value={formData.bank_account_holder}
                  onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
                  placeholder="예금주명"
                />
              </div>

              <div className="space-y-2">
                <Label>계좌번호</Label>
                <Input
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  placeholder="- 없이 입력"
                />
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
            </div>
          </CardContent>
        </Card>
      </div>
    </RepLayout>
  );
}