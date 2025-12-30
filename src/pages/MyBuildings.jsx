import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Plus, MapPin, Users, ChevronRight, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import RoleBadge from '@/components/common/RoleBadge';

export default function MyBuildings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [buildingsData, setBuildingsData] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Get user's memberships
        const memberships = await base44.entities.BuildingMember.filter({
          user_email: currentUser.email,
          status: "활성"
        });

        if (memberships.length === 0) {
          navigate(createPageUrl("Onboarding"));
          return;
        }

        // Get building details for each membership
        const buildingIds = memberships.map(m => m.building_id);
        const buildings = await base44.entities.Building.list();
        const filteredBuildings = buildings.filter(b => buildingIds.includes(b.id));

        // Combine data
        const combined = memberships.map(m => {
          const building = filteredBuildings.find(b => b.id === m.building_id);
          return {
            ...m,
            building
          };
        }).filter(item => item.building);

        setBuildingsData(combined);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        base44.auth.redirectToLogin();
      }
    }
    loadData();
  }, [navigate]);

  const handleBuildingClick = (item) => {
    const { building, role } = item;
    
    // Check if building setup is incomplete
    if ((role === "대표자" || role === "representative") && (building.status === "draft" || building.setup_step < 5)) {
      navigate(createPageUrl(`BuildingSetupWizard?buildingId=${building.id}`));
      return;
    }
    
    if (role === "대표자" || role === "representative") {
      navigate(createPageUrl(`RepDashboard?buildingId=${building.id}`));
    } else {
      navigate(createPageUrl(`TenantDashboard?buildingId=${building.id}`));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">내 공동주택</h1>
            <p className="text-slate-500 mt-1">관리 중인 공동주택 목록</p>
          </div>
          <Button 
            onClick={() => navigate(createPageUrl("BuildingSetupWizard"))}
            className="bg-primary hover:bg-primary-dark text-white rounded-full px-6 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 건물 등록
          </Button>
        </div>

        {/* Building List */}
        {buildingsData.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="등록된 공동주택이 없습니다"
            description="새 공동주택을 등록하거나 초대를 받아 시작하세요."
            actionLabel="새 건물 등록"
            onAction={() => navigate(createPageUrl("BuildingSetupWizard"))}
          />
        ) : (
          <div className="space-y-4">
            {buildingsData.map((item) => (
              <Card 
                key={item.id}
                className="cursor-pointer hover:shadow-xl transition-all group card-rounded border border-slate-200"
                onClick={() => handleBuildingClick(item)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {item.building?.name || "이름 없음"}
                        </h3>
                        <RoleBadge role={item.role} />
                        {(item.role === "대표자" || item.role === "representative") && (item.building?.status === "draft" || item.building?.setup_step < 5) && (
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            초기 설정 미완료
                          </Badge>
                        )}
                      </div>
                      {item.building?.address && (
                        <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{item.building.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Users className="w-3.5 h-3.5" />
                        {item.building?.building_units_count > 0 ? (
                          <span>입주자 {item.building.building_units_count}세대</span>
                        ) : (
                          <span className="text-slate-400">세대 정보 미등록</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}