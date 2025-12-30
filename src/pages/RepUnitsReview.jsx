import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Home, Check, X } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';

export default function RepUnitsReview() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [units, setUnits] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, [buildingId]);

  const loadData = async () => {
    if (!buildingId) return;
    try {
      const data = await base44.entities.Unit.filter({
        building_id: buildingId,
        status: "active"
      });
      // Filter units that need review (입주자가 추가 정보를 입력한 경우)
      const needsReview = data.filter(u => 
        u.tenant_email || u.tenant_move_in_date || u.tenant_memo
      );
      setUnits(needsReview);
      setIsLoadingData(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoadingData(false);
    }
  };

  const handleApprove = async (unitId) => {
    try {
      await base44.entities.Unit.update(unitId, {
        needs_review: false
      });
      await loadData();
    } catch (err) {
      console.error("Error approving:", err);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUnitDisplay = (unit) => {
    return [unit.dong, unit.floor, unit.ho].filter(Boolean).join(" ") || "호수 미입력";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader
          title="입주자 정보 검토"
          subtitle="입주자가 추가로 입력한 정보를 확인합니다"
          backUrl={createPageUrl('RepDashboard') + `?buildingId=${buildingId}`}
        />

        {units.length === 0 ? (
          <EmptyState
            icon={Home}
            title="검토할 정보가 없습니다"
            description="입주자가 추가 정보를 입력하면 여기에 표시됩니다."
          />
        ) : (
          <div className="space-y-3">
            {units.map((unit) => (
              <Card key={unit.id} className="card-rounded">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                        <Home className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{getUnitDisplay(unit)}</p>
                        <p className="text-sm text-slate-500">{unit.tenant_name}</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                      검토 필요
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {unit.tenant_email && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">이메일</span>
                        <span className="text-slate-900">{unit.tenant_email}</span>
                      </div>
                    )}
                    {unit.tenant_move_in_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">입주일</span>
                        <span className="text-slate-900">
                          {new Date(unit.tenant_move_in_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {unit.tenant_memo && (
                      <div className="text-sm">
                        <span className="text-slate-500">메모:</span>
                        <p className="text-slate-900 mt-1 bg-slate-50 p-2 rounded">
                          {unit.tenant_memo}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(unit.id)}
                      className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-full font-semibold"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      승인
                    </Button>
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