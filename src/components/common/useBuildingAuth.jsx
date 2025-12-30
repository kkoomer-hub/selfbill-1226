import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Role mapping for internal normalization
const ROLE_MAP = {
  "대표자": "representative",
  "입주자": "tenant",
  "representative": "representative",
  "tenant": "tenant"
};

const DISPLAY_ROLE_MAP = {
  "representative": "대표자",
  "tenant": "입주자",
  "대표자": "대표자",
  "입주자": "입주자"
};

export function useBuildingAuth(buildingId, requiredRole = null) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [building, setBuilding] = useState(null);
  const [membership, setMembership] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        setIsLoading(true);
        
        // Get current user
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (!buildingId || buildingId === 'null' || buildingId === 'undefined') {
          setIsLoading(false);
          return;
        }

        // Get building
        const buildings = await base44.entities.Building.filter({ id: buildingId });
        if (buildings.length === 0) {
          setError("존재하지 않는 공동주택입니다.");
          setIsLoading(false);
          return;
        }
        setBuilding(buildings[0]);

        // Check membership
        const memberships = await base44.entities.BuildingMember.filter({
          building_id: buildingId,
          user_email: currentUser.email,
          status: "활성"
        });

        if (memberships.length === 0) {
          setError("이 공동주택에 대한 권한이 없습니다.");
          setIsLoading(false);
          return;
        }

        const member = memberships[0];
        setMembership(member);

        // Check role if required
        if (requiredRole) {
          const normalizedRequiredRole = ROLE_MAP[requiredRole] || requiredRole;
          // Check if the user's role matches the required role (handling both English and Korean inputs)
          const userRole = member.role; // This should be "representative" or "tenant" from DB
          
          if (userRole !== normalizedRequiredRole) {
            const displayRole = DISPLAY_ROLE_MAP[normalizedRequiredRole] || requiredRole;
            setError(`이 페이지는 ${displayRole}만 접근할 수 있습니다.`);
            setIsLoading(false);
            return;
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Auth error:", err);
        console.error("Auth error:", err);
        setError("인증 오류가 발생했습니다: " + (err.message || err));
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [buildingId, requiredRole]);

  return { 
    isLoading, 
    user, 
    building, 
    membership, 
    error,
    isRepresentative: membership?.role === "representative" || membership?.role === "대표자",
    isTenant: membership?.role === "tenant" || membership?.role === "입주자"
  };
}