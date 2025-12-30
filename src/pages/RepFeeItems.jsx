import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Plus, Loader2, FileText, Trash2, Edit2, X } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { useBuildingAuth } from '@/components/common/useBuildingAuth';
import RepLayout from '@/components/common/RepLayout';

export default function RepFeeItems() {
  const urlParams = new URLSearchParams(window.location.search);
  const buildingId = urlParams.get('buildingId');
  const navigate = useNavigate();
  
  const { isLoading, building, error } = useBuildingAuth(buildingId, "대표자");
  const [templates, setTemplates] = useState([]);
  const [units, setUnits] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("일반");
  const [formData, setFormData] = useState({
    name: "",
    category: "일반",
    amount_type: "고정",
    default_amount: "",
    default_type: "공용",
    default_months: [1,2,3,4,5,6,7,8,9,10,11,12],
    default_target_unit_ids: []
  });

  useEffect(() => {
    loadData();
  }, [buildingId]);

  const loadData = async () => {
    if (!buildingId) return;
    try {
      const [templatesData, unitsData] = await Promise.all([
        base44.entities.BillItemTemplate.filter({ building_id: buildingId }),
        base44.entities.Unit.filter({ building_id: buildingId, status: "active" })
      ]);
      setTemplates(templatesData);
      setUnits(unitsData);
      setIsLoadingData(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoadingData(false);
    }
  };

  const handleOpenDialog = (template = null, category = "일반") => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name || "",
        category: template.category || "일반",
        amount_type: template.amount_type || "고정",
        default_amount: template.default_amount || "",
        default_type: template.default_type || "공용",
        default_months: template.default_months || [1,2,3,4,5,6,7,8,9,10,11,12],
        default_target_unit_ids: template.default_target_unit_ids || []
      });
    } else {
      setEditingTemplate(null);
      const defaultType = category === "기타" ? "세대별" : "공용";
      setFormData({
        name: "",
        category: category,
        amount_type: "고정",
        default_amount: "",
        default_type: defaultType,
        default_months: [1,2,3,4,5,6,7,8,9,10,11,12],
        default_target_unit_ids: []
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (formData.category === "기타" && formData.default_target_unit_ids.length === 0) {
      alert("기타 항목은 하나 이상의 부과 대상 세대를 선택해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        ...formData,
        building_id: buildingId,
        default_amount: formData.default_amount ? parseFloat(formData.default_amount) : 0
      };

      if (editingTemplate) {
        await base44.entities.BillItemTemplate.update(editingTemplate.id, saveData);
      } else {
        await base44.entities.BillItemTemplate.create(saveData);
      }
      
      await loadData();
      setShowDialog(false);
    } catch (err) {
      console.error("Error saving template:", err);
    }
    setIsSaving(false);
  };

  const handleDelete = async (templateId) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    
    try {
      await base44.entities.BillItemTemplate.delete(templateId);
      await loadData();
    } catch (err) {
      console.error("Error deleting template:", err);
    }
  };

  const toggleMonth = (month) => {
    const months = formData.default_months || [];
    if (months.includes(month)) {
      setFormData({ ...formData, default_months: months.filter(m => m !== month) });
    } else {
      setFormData({ ...formData, default_months: [...months, month].sort((a, b) => a - b) });
    }
  };

  const toggleUnit = (unitId) => {
    const units = formData.default_target_unit_ids || [];
    if (units.includes(unitId)) {
      setFormData({ ...formData, default_target_unit_ids: units.filter(id => id !== unitId) });
    } else {
      setFormData({ ...formData, default_target_unit_ids: [...units, unitId] });
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepFeeItems">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </RepLayout>
    );
  }

  if (error) {
    return (
      <RepLayout buildingId={buildingId} building={building} currentPage="RepFeeItems">
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

  const getTemplatesByCategory = (category) => templates.filter(t => t.category === category);

  const TemplateList = ({ category }) => {
    const items = getTemplatesByCategory(category);
    
    if (items.length === 0) {
      return (
        <EmptyState
          icon={FileText}
          title="등록된 항목이 없습니다"
          description="항목을 추가하여 매월 부과할 관리비를 정의하세요."
          actionLabel="항목 추가"
          onAction={() => handleOpenDialog(null, category)}
        />
      );
    }

    return (
      <div className="space-y-3">
        {items.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-all card-rounded">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-slate-900">{template.name}</p>
                    <Badge className={template.default_type === "공용" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}>
                      {template.default_type}
                    </Badge>
                    <Badge className={template.amount_type === "고정" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}>
                      {template.amount_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">
                    {template.amount_type === "고정" ? `기본 금액: ${template.default_amount?.toLocaleString() || 0}원` : "매달 금액 입력"}
                  </p>
                  {template.default_months && template.default_months.length < 12 && (
                    <p className="text-xs text-slate-400">
                      부과월: {template.default_months.join(", ")}월
                    </p>
                  )}
                  {template.default_target_unit_ids && template.default_target_unit_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.default_target_unit_ids.map(unitId => {
                        const unit = units.find(u => u.id === unitId);
                        return unit ? (
                          <Badge key={unitId} variant="outline" className="text-xs">
                            {unit.unit_name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(template)}
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <RepLayout buildingId={buildingId} building={building} currentPage="RepFeeItems">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader
          title="관리비 항목"
          subtitle="매월 부과할 관리비 항목을 설정합니다"
          backUrl={createPageUrl('RepDashboard') + `?buildingId=${buildingId}`}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="일반">일반관리비</TabsTrigger>
            <TabsTrigger value="수선">수선유지비</TabsTrigger>
            <TabsTrigger value="기타">기타(세대별)</TabsTrigger>
          </TabsList>

          <div className="mb-4 flex justify-end">
            <Button onClick={() => handleOpenDialog(null, activeTab)}>
              <Plus className="w-4 h-4 mr-2" />
              항목 추가
            </Button>
          </div>

          <TabsContent value="일반">
            <TemplateList category="일반" />
          </TabsContent>

          <TabsContent value="수선">
            <TemplateList category="수선" />
          </TabsContent>

          <TabsContent value="기타">
            <TemplateList category="기타" />
          </TabsContent>
        </Tabs>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "항목 수정" : "항목 추가"}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>항목명 *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 공용전기료, 수선충당금"
                />
              </div>

              <div className="space-y-2">
                <Label>금액 유형</Label>
                <Select value={formData.amount_type} onValueChange={(val) => setFormData({ ...formData, amount_type: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="고정">고정 (변동 없음)</SelectItem>
                    <SelectItem value="변동">변동 (매달 입력)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.amount_type === "고정" && (
                <div className="space-y-2">
                  <Label>기본 금액 (원)</Label>
                  <Input
                    type="number"
                    value={formData.default_amount}
                    onChange={(e) => setFormData({ ...formData, default_amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>부과 월 선택</Label>
                <div className="grid grid-cols-6 gap-2">
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
                    <label key={month} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.default_months?.includes(month)}
                        onCheckedChange={() => toggleMonth(month)}
                      />
                      <span className="text-sm">{month}월</span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.category === "기타" && (
                <div className="space-y-2 border-t pt-4">
                  <Label>부과 대상 세대 *</Label>
                  <p className="text-xs text-slate-500 mb-3">
                    이 항목을 부과할 세대를 선택하세요
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {units.map(unit => (
                      <label key={unit.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                        <Checkbox
                          checked={formData.default_target_unit_ids?.includes(unit.id)}
                          onCheckedChange={() => toggleUnit(unit.id)}
                        />
                        <span className="text-sm">{unit.unit_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={!formData.name || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RepLayout>
  );
}