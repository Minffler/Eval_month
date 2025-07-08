'use client';

import * as React from 'react';
import {
  Users,
  LayoutDashboard,
  BarChart3,
  FileCheck,
  FileText,
  User,
  LogOut,
  ChevronsLeftRight,
} from 'lucide-react';

import { useAuth } from '@/contexts/auth-context';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import Header from '@/components/evalmax/header';
import AdminDashboard from '@/components/evalmax/admin-dashboard';
import EvaluatorDashboard from '@/components/evalmax/evaluator-dashboard';
import EmployeeDashboard from '@/components/evalmax/employee-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user, role, setUser } = useAuth();
  const [activeMenu, setActiveMenu] = React.useState('dashboard');

  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard />;
      case 'evaluator':
        return <EvaluatorDashboard />;
      case 'employee':
        return <EmployeeDashboard />;
      default:
        return null;
    }
  };

  const navItems = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'results', label: 'All Results', icon: BarChart3 },
      { id: 'consistency', label: 'Consistency Check', icon: FileCheck },
    ],
    evaluator: [
      { id: 'dashboard', label: 'Evaluation Hub', icon: LayoutDashboard },
      { id: 'my-team', label: 'My Team', icon: Users },
    ],
    employee: [
      { id: 'my-results', label: 'My Results', icon: FileText },
    ],
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <ChevronsLeftRight className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-headline font-bold text-primary">EvalMax</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {(navItems[role] || []).map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => setActiveMenu(item.id)}
                  isActive={activeMenu === item.id}
                  tooltip={{ children: item.label, side: 'right' }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex flex-col gap-2 p-4">
              <Button variant="outline"><LogOut className="mr-2"/> Logout</Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {user ? renderDashboard() : <p>Loading...</p>}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
