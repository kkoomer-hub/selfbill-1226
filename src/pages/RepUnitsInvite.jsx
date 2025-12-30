import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Send, Loader2, CheckCircle2, Clock } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepUnitsInvite() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [units, setUnits] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadData();
  }, [buildingId]);

  const loadData = async () => {
    if (!buildingId) return;
    try {
      const [unitsData, invitationsData] = await Promise.all([
        base44.entities.Unit.filter({ building_id: buildingId, status: "active" }),
        base44.entities.Invitation.filter({ building_id: buildingId })
      ]);
      setUnits(unitsData);
      setInvitations(invitationsData);
      setIsLoadingData(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoadingData(false);
    }
  };

  const getInvitationStatus = (unitId) => {
    const invitation = invitations.find(inv => inv.unit_id === unitId);
    return invitation?.status || "초대 전";
  };

  const handleSendInvitation = async (unit) => {
    if (!unit.tenant_name || !unit.tenant_phone) {
      alert("입주자 이름과 연락처를 먼저 입력해 주세요.");
      return;
    }

    setIsSending(true);
    try {
      const existingInvitation = invitations.find(inv => inv.unit_id === unit.id);
      
      const invitationData = {
        building_id: buildingId,
        unit_id: unit.id,
        tenant_name: unit.tenant_name,
        tenant_phone: unit.tenant_phone,
        status: "초대 발송",
        invited_at: new Date().toISOString()
      };

      let invitation;
      if (existingInvitation) {
        invitation = await base44.entities.Invitation.update(existingInvitation.id, invitationData);
      } else {
        invitation = await base44.entities.Invitation.create(invitationData);
      }

      // Create notification log
      const inviteUrl = `${window.location.origin}${createPageUrl('AcceptInvite') + `?inviteId=${invitation.id}`}`;
      const notificationBody = `[셀프빌 입주자 초대]\n\n${building.name}\n${unit.unit_name}\n\n${unit.tenant_name}님을 입주자로 초대합니다.\n\n아래 링크를 클릭하여 초대를 수락해 주세요.\n\n${inviteUrl}`;

      await base44.entities.NotificationLog.create({
        building_id: buildingId,
        to_phone: unit.tenant_phone,
        channel: "MMS",
        event_type: "INVITATION",
        event_ref_id: invitation.id,
        title: "셀프빌 입주자 초대",
        body: notificationBody,
        status: "발송성공",
        sent_at: new Date().toISOString()
      });

      await loadData();
    } catch (err) {
      console.error("Error sending invitation:", err);
    }
    setIsSending(false);
  };

  const handleSendAll = async () => {
    if (!confirm("모든 세대에 초대 MMS를 발송하시겠습니까?")) return;

    setIsSending(true);
    for (const unit of units) {
      if (unit.tenant_name && unit.tenant_phone && getInvitationStatus(unit.id) !== "가입 완료") {
        await handleSendInvitation(unit);
      }
    }
    setIsSending(false);
  };

  if (isLoading || isLoadingData) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepUnitsInvite">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepUnitsInvite">
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

  const getStatusBadge = (status) => {
    const config = {
      "초대 전": { className: "bg-slate-100 text-slate-700", icon: Clock },
      "초대 발송": { className: "bg-blue-100 text-blue-700", icon: Send },
      "가입 완료": { className: "bg-green-100 text-green-700", icon: CheckCircle2 }
    };
    const { className, icon: Icon } = config[status] || config["초대 전"];
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <RepLayout buildingId={buildingId} building={building} currentPage="RepUnitsInvite">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <PageHeader
          title="입주자 초대"
          subtitle="세대별로 입주자 초대 MMS를 발송합니다"
          backUrl={createPageUrl('RepDashboard') + `?buildingId=${buildingId}`}
          actions={
            <Button 
              onClick={handleSendAll}
              disabled={isSending}
              className="bg-primary hover:bg-primary-dark text-white rounded-full font-semibold"
            >
              <Send className="w-4 h-4 mr-2" />
              전체 발송
            </Button>
          }
        />

        {units.length === 0 ? (
          <EmptyState
            icon={Send}
            title="등록된 세대가 없습니다"
            description="세대를 먼저 등록해 주세요."
            actionLabel="세대 관리로 이동"
            onAction={() => navigate(createPageUrl('RepUnits') + `?buildingId=${buildingId}`)}
          />
        ) : (
          <div className="space-y-3">
            {units.map((unit) => {
              const status = getInvitationStatus(unit.id);
              const canSend = unit.tenant_name && unit.tenant_phone && status !== "가입 완료";
              
              return (
                <Card key={unit.id} className="card-rounded hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-bold text-slate-900">{unit.unit_name}</p>
                          {getStatusBadge(status)}
                        </div>
                        {unit.tenant_name && (
                          <p className="text-sm text-slate-600">
                            {unit.tenant_name}
                            {unit.tenant_phone && ` · ${unit.tenant_phone}`}
                          </p>
                        )}
                        {!unit.tenant_name && (
                          <p className="text-sm text-slate-400">입주자 정보 미입력</p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleSendInvitation(unit)}
                        disabled={!canSend || isSending}
                        size="sm"
                        className="bg-primary hover:bg-primary-dark text-white rounded-full"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1" />
                            {status === "초대 발송" ? "재발송" : "초대"}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </RepLayout>
  );
}