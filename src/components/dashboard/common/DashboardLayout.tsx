import React from 'react';
import { Sidebar } from '@/components/evalmax/sidebar';
import { Header } from '@/components/evalmax/header';
import { useAuth } from '@/contexts/auth-context';
import { useNotification } from '@/contexts/notification-context';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * 공통 대시보드 레이아웃 컴포넌트
 * 모든 대시보드에서 공통으로 사용되는 사이드바와 헤더를 포함
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle
}) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        user={user}
        logout={logout}
        unreadNotificationCount={unreadCount}
        unreadApprovalCount={0}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}; 