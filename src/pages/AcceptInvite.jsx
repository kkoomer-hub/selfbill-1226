import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Building2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AcceptInvite() {
  const urlParams = new URLSearchParams(window.location.search);
  const inviteId = urlParams.get('inviteId');
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [user, setUser] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [building, setBuilding] = useState(null);
  const [unit, setUnit] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [inviteId]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (!inviteId) {
        setError("유효하지 않은 초대 링크입니다.");
        setIsLoading(false);
        return;
      }

      const invitations = await base44.entities.Invitation.filter({ id: inviteId });
      if (invitations.length === 0) {
        setError("초대를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      const inv = invitations[0];
      
      if (inv.status === "가입 완료") {
        setError("이미 수락된 초대입니다.");
        setIsLoading(false);
        return;
      }

      setInvitation(inv);

      const [buildings, units] = await Promise.all([
        base44.entities.Building.filter({ id: inv.building_id }),
        base44.entities.Unit.filter({ id: inv.unit_id })
      ]);

      if (buildings.length > 0) setBuilding(buildings[0]);
      if (units.length > 0) setUnit(units[0]);

      setIsLoading(false);
    } catch (err) {
      console.error("Load error:", err);
      setError("초대 정보를 불러오는 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      // Create BuildingMember
      await base44.entities.BuildingMember.create({
        building_id: invitation.building_id,
        user_id: user.id,
        user_email: user.email,
        role: "입주자",
        unit_id: invitation.unit_id,
        status: "활성"
      });

      // Update invitation status
      await base44.entities.Invitation.update(invitation.id, {
        status: "가입 완료",
        accepted_at: new Date().toISOString()
      });

      navigate(createPageUrl(`TenantDashboard?buildingId=${invitation.building_id}`));
    } catch (err) {
      console.error("Accept error:", err);
      alert("초대 수락 중 오류가 발생했습니다.");
    }
    setIsAccepting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
        <LoadingSpinner text="초대 정보 확인 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">오류</h2>
            <p className="text-slate-500 mb-4">{error}</p>
            <Button onClick={() => navigate(createPageUrl("MyBuildings"))}>
              내 건물 목록으로
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-slate-900">셀프빌</span>
          </div>
          <p className="text-slate-600">입주자 초대 수락</p>
        </div>

        <Card className="card-rounded">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                입주자 초대장
              </h2>
              <p className="text-slate-600">
                아래 건물의 입주자로 초대되었습니다
              </p>
            </div>

            <div className="space-y-4 mb-6 bg-slate-50 rounded-lg p-4">
              <div>
                <Label className="text-xs text-slate-500">건물명</Label>
                <p className="text-lg font-semibold text-slate-900">{building?.name}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">주소</Label>
                <p className="text-sm text-slate-700">{building?.address}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">세대</Label>
                <p className="text-sm text-slate-700">{unit?.unit_name}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">입주자명</Label>
                <p className="text-sm text-slate-700">{invitation?.tenant_name}</p>
              </div>
            </div>

            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full"
              size="lg"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                "초대 수락하기"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}