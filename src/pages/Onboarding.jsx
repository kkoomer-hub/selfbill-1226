import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Users, Shield, ArrowRight, Check, LogOut } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PhoneInput from '@/components/common/PhoneInput';

export default function Onboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState("select"); // select, invite-check
  const [selectedRole, setSelectedRole] = useState(null);
  const [phone1, setPhone1] = useState("010");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");
  const [checkingInvite, setCheckingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Check if user already has memberships
        const memberships = await base44.entities.BuildingMember.filter({
          user_email: currentUser.email,
          status: "활성"
        });
        
        if (memberships.length > 0) {
          // If the user has any memberships, redirect to MyBuildings
          navigate(createPageUrl("MyBuildings"));
          return;
        }
        
        setIsLoading(false);
      } catch (err) {
        base44.auth.redirectToLogin();
      }
    }
    init();
  }, [navigate]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === "대표자") {
      navigate(createPageUrl("BuildingSetupWizard"));
    } else {
      setStep("invite-check");
    }
  };

  const handleCheckInvite = async () => {
    // Validate phone format
    if (!phone1 || !phone2 || !phone3) {
      alert("전화번호를 모두 입력해주세요.");
      return;
    }
    
    if (phone1.length < 3 || phone2.length !== 4 || phone3.length !== 4) {
      alert("올바른 전화번호 형식으로 입력해주세요. (예: 010-1234-5678)");
      return;
    }
    
    const invitePhone = `${phone1}-${phone2}-${phone3}`;
    
    setCheckingInvite(true);
    setInviteError("");
    
    try {
      // Search for invitation by phone
      const invitations = await base44.entities.Invitation.filter({
        tenant_phone: invitePhone,
        status: "초대 발송"
      });
      
      if (invitations.length === 0) {
        setInviteError("해당 번호로 발송된 초대장을 찾을 수 없습니다.");
        setCheckingInvite(false);
        return;
      }
      
      const invitation = invitations[0];
      
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
        joined_at: new Date().toISOString()
      });
      
      navigate(createPageUrl("MyBuildings"));
    } catch (err) {
      setInviteError("초대 확인 중 오류가 발생했습니다.");
    }
    
    setCheckingInvite(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner text="확인 중..." />
      </div>
    );
  }

  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      await base44.auth.signOut();
      navigate(createPageUrl("Login"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header Buttons */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-slate-900">셀프빌</span>
          </div>
          <p className="text-slate-600">공동주택 관리비 자동화 서비스</p>
        </div>

        {step === "select" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
              셀프빌 시작하기
            </h2>
            
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-primary card-rounded"
              onClick={() => handleRoleSelect("대표자")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center flex-shrink-0">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">새로운 공동주택을 등록할 대표자입니다</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      내가 관리하는 공동주택을 처음 셀프빌에 등록합니다.
                      건물 정보, 세대, 관리비 항목을 설정하고 관리할 수 있습니다.
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-300 flex-shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-primary card-rounded"
              onClick={() => handleRoleSelect("입주자")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center flex-shrink-0">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">이미 대표자에게 초대받은 입주자입니다</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      대표자가 보내준 초대 정보를 통해 입주자로 연결합니다.
                      나의 관리비 청구서와 납부 현황을 확인할 수 있습니다.
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-300 flex-shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "invite-check" && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                초대 확인
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                대표자로부터 초대 문자를 받으신 휴대폰 번호를 입력해주세요.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>휴대폰 번호 *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={phone1}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setPhone1(val);
                      }}
                      className="w-20"
                      placeholder="010"
                    />
                    <span>-</span>
                    <Input
                      type="text"
                      value={phone2}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPhone2(val);
                      }}
                      className="w-24"
                      placeholder="1234"
                    />
                    <span>-</span>
                    <Input
                      type="text"
                      value={phone3}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPhone3(val);
                      }}
                      className="w-24"
                      placeholder="5678"
                    />
                  </div>
                </div>

                {inviteError && (
                  <p className="text-sm text-red-500">{inviteError}</p>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("select")}
                    className="flex-1"
                  >
                    뒤로
                  </Button>
                  <Button
                    onClick={handleCheckInvite}
                    disabled={checkingInvite || !phone1 || !phone2 || !phone3}
                    className="flex-1"
                  >
                    {checkingInvite ? "확인 중..." : "초대 확인"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}