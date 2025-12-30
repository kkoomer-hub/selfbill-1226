import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Building2, Receipt, CreditCard, Home, Menu, X, 
  ChevronDown, ChevronUp, LogOut
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

export default function TenantLayout({ buildingId, building, currentPage, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'TenantDashboard', label: '대시보드', icon: Home },
    { id: 'TenantMyUnit', label: '나의 입주 현황', icon: Home },
    { id: 'TenantMyBills', label: '나의 관리비 청구서', icon: Receipt },
    { id: 'TenantMyPayments', label: '나의 납부 현황', icon: CreditCard }
  ];

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await base44.auth.logout(createPageUrl("Onboarding"));
    }
  };

  const renderMenu = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {/* Building Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{building?.name || '공동주택'}</p>
              <p className="text-xs text-slate-500">입주자</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Link
                key={item.id}
                to={createPageUrl(`${item.id}?buildingId=${buildingId}`)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-3 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">로그아웃</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r fixed h-screen">
        {renderMenu()}
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" />
          <span className="font-semibold text-slate-900">{building?.name || '공동주택'}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white z-50 shadow-xl">
            <div className="h-16 flex items-center justify-between px-4 border-b">
              <span className="font-semibold text-slate-900">메뉴</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            {renderMenu()}
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}