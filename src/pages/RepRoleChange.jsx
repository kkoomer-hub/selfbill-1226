import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Users, Shield, Send, Clock, Check, X } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepRoleChange() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, user, building, error } = useBuildingAuth(buildingId, "대표자");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  useEffect(() => {
    loadData();
  }, [buildingId]);

  const loadData = async () => {
    if (!buildingId) return;
    setIsLoadingData(true);
    
    try {
      const [membersData, requestsData] = await Promise.all([
        base44.entities.BuildingMember.filter({ building_id: buildingId, status: "활성" }),
        base44.entities.RoleChangeRequest.filter({ building_id: buildingId })
      ]);

      setMembers(membersData.filter(m => m.role === "입주자" || m.role === "tenant"));
      setRequests(requestsData.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at)));
      setIsLoadingData(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoadingData(false);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedMemberId) return;
    setIsSending(true);
    
    try {
      const selectedMember = members.find(m => m.id === selectedMemberId);
      if (!selectedMember) return;

      // Create role change request
      await base44.entities.RoleChangeRequest.create({
        building_id: buildingId,
        from_user_email: user.email,
        to_user_email: selectedMember.user_email,
        status: "대기중",
        requested_at: new Date().toISOString()
      });

      // Create notification log
      await base44.entities.NotificationLog.create({
        building_id: buildingId,
        type: "대표자변경",
        to_phone: selectedMember.user_phone || "",
        to_name: selectedMember.user_email,
        message_content: `[${building?.name}] 대표자 변경 요청\n\n안녕하세요,\n현재 대표자(${user.email})님이 귀하를 새 대표자로 지정하였습니다.\n\n셀프빌 앱에서 확인해주세요.`,
        status: "성공",
        reference_type: "RoleChangeRequest",
        sent_at: new Date().toISOString()
      });

      await loadData();
      setSelectedMemberId("");
    } catch (err) {
      console.error("Error sending request:", err);
    }
    
    setIsSending(false);
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await base44.entities.RoleChangeRequest.update(requestId, {
        status: "취소됨",
        processed_at: new Date().toISOString()
      });
      await loadData();
    } catch (err) {
      console.error("Error canceling request:", err);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepRoleChange">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepRoleChange">
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
    switch (status) {
      case "대기중":
        return (
          <span className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs">
            <Clock className="w-3 h-3" /> 대기중
          </span>
        );
      case "승인됨":
        return (
          <span className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded text-xs">
            <Check className="w-3 h-3" /> 승인됨
          </span>
        );
      case "거절됨":
        return (
          <span className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded text-xs">
            <X className="w-3 h-3" /> 거절됨
          </span>
        );
      case "취소됨":
        return (
          <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs">
            <X className="w-3 h-3" /> 취소됨
          </span>
        );
      default:
        return null;
    }
  };

  const pendingRequest = requests.find(r => r.status === "대기중");

  return (
    <RepLayout buildingId={buildingId} building={building} currentPage="RepRoleChange">
      <div className="max-w-lg mx-auto px-4 py-6">
        <PageHeader
          title="대표자 변경"
          subtitle="다른 입주자를 대표자로 지정합니다"
          backUrl={createPageUrl('RepDashboard') + `?buildingId=${buildingId}`}
        />

        {/* Current Representative */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              현재 대표자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-slate-900">{user?.email}</p>
          </CardContent>
        </Card>

        {/* New Request */}
        {!pendingRequest && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">새 대표자 지정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {members.length === 0 ? (
                <p className="text-slate-500 text-center py-4">
                  지정 가능한 입주자가 없습니다.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>새 대표자 선택</Label>
                    <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                      <SelectTrigger>
                        <SelectValue placeholder="입주자 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.user_email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleSendRequest}
                    disabled={!selectedMemberId || isSending}
                    className="w-full"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        요청 중...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        대표자 변경 요청
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Request */}
        {pendingRequest && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">대기 중인 요청</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {pendingRequest.to_user_email}님에게 대표자 변경 요청을 보냈습니다.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelRequest(pendingRequest.id)}
                    className="mt-3"
                  >
                    요청 취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request History */}
        {requests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">요청 이력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      → {request.to_user_email}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(request.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </RepLayout>
  );
}