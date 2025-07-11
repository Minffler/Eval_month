'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Bell,
  Inbox,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { User } from '@/lib/types';
import { Separator } from '../ui/separator';
import { useNotifications } from '@/contexts/notification-context';

export type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: NavItem[];
};

interface SidebarProps {
  navItems: NavItem[];
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  logout: () => void;
}

export function Sidebar({ navItems, activeView, setActiveView, isOpen, setIsOpen, user, logout }: SidebarProps) {
  const [openAccordion, setOpenAccordion] = React.useState<string[]>([]);
  const { unreadNotificationCount, unreadApprovalCount } = useNotifications();

  React.useEffect(() => {
    if (isOpen) {
      setOpenAccordion(navItems.map(item => item.id));
    }
  }, [isOpen, navItems]);

  const handleNavClick = (id: string, hasChildren: boolean) => {
    // If it has children, the accordion will handle opening/closing.
    // If it doesn't have children, or if the sidebar is closed, set the active view.
    if (!hasChildren || !isOpen) {
      setActiveView(id);
    }
  };

  const NavLink = ({ item, unreadCount = 0 }: { item: NavItem, unreadCount?: number }) => {
    return (
      <Button
        variant={activeView === item.id ? 'secondary' : 'ghost'}
        className={cn("w-full justify-center gap-3", isOpen ? "justify-start" : "justify-center")}
        onClick={() => handleNavClick(item.id, !!item.children)}
        title={item.label}
      >
          <div className="relative">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {unreadCount > 0 && (
                  <span className={cn("absolute flex h-2.5 w-2.5", isOpen ? "-top-0.5 -right-0.5" : "top-0 right-0")}>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
              )}
          </div>
        {isOpen && <span className="truncate flex-grow text-left">{item.label}</span>}
      </Button>
    );
  };
  
  const BottomNavLink = ({ item, unreadCount = 0 }: { item: NavItem, unreadCount?: number }) => {
    return (
      <Button
        variant={activeView === item.id ? 'secondary' : 'ghost'}
        className={cn("w-full justify-center gap-3")}
        onClick={() => setActiveView(item.id)}
        title={item.label}
      >
          <div className="relative">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {unreadCount > 0 && (
                  <span className={cn("absolute flex h-2.5 w-2.5", isOpen ? "-top-0.5 -right-0.5" : "top-0 right-0")}>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
              )}
          </div>
        {isOpen && <span className="truncate">{item.label}</span>}
      </Button>
    );
  };
  
  const userProfile = user ? (
    <div className={cn("flex items-center justify-between gap-3 p-2", isOpen && "pl-4")}>
      {isOpen && (
        <div className="flex flex-col text-left overflow-hidden">
            <span className="font-semibold text-sm truncate">{user?.name}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.department} / {user?.title}</span>
        </div>
      )}
      <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0" onClick={logout}>
          <LogOut className="h-5 w-5" />
      </Button>
    </div>
  ) : null;

  const notificationItem: NavItem = { id: 'notifications', label: '알림함', icon: Bell };
  const approvalItem: NavItem = { id: 'approvals', label: '결재함', icon: Inbox };

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-20 h-full flex flex-col flex-shrink-0 border-r bg-card transition-all duration-300 ease-in-out',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
        <div className={cn("flex h-16 items-center border-b px-4", isOpen ? "justify-between" : "justify-center")}>
          {isOpen && <h2 className="text-lg font-bold truncate">PL월성과평가</h2>}
        </div>
        <ScrollArea className="flex-1">
          <nav className="flex-1 space-y-1 p-2">
              {navItems.map((item) => {
                if (!item.children) {
                  return <NavLink key={item.id} item={item} />;
                }

                if (isOpen) {
                  return (
                    <Accordion
                      key={item.id}
                      type="multiple"
                      value={openAccordion}
                      onValueChange={setOpenAccordion}
                      className="w-full"
                    >
                      <AccordionItem value={item.id} className="border-b-0">
                        <AccordionTrigger className={cn("rounded-md px-3 py-2 text-sm font-medium hover:bg-muted hover:no-underline [&[data-state=open]>svg]:text-primary")}>
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pl-6 pb-0 space-y-1">
                            {item.children.map((child) => (
                                <NavLink key={child.id} item={child} />
                            ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                } else {
                  const isChildActive = item.children.some(child => child.id === activeView);
                  return (
                    <Popover key={item.id}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={isChildActive ? "secondary" : "ghost"}
                          className="w-full justify-center"
                          title={item.label}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="right" align="start" className="w-56 p-1">
                        <div className="space-y-1">
                          <p className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">{item.label}</p>
                          {item.children.map((child) => (
                            <Button
                              key={child.id}
                              variant={activeView === child.id ? 'secondary' : 'ghost'}
                              className="w-full justify-start gap-3"
                              onClick={() => setActiveView(child.id)}
                            >
                              <child.icon className="h-5 w-5 flex-shrink-0" />
                              <span>{child.label}</span>
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                }
              })}
          </nav>
        </ScrollArea>
        <div className="mt-auto border-t">
             <div className={cn("p-2 flex", isOpen ? "flex-row space-x-1" : "flex-col space-y-1")}>
              <BottomNavLink item={approvalItem} unreadCount={unreadApprovalCount} />
              <BottomNavLink item={notificationItem} unreadCount={unreadNotificationCount} />
            </div>
            <Separator />
            {userProfile}
        </div>

        <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute -right-5 top-8 z-30 bg-background hover:bg-muted border rounded-full h-10 w-10"
          >
            <ChevronLeft
              className={cn('h-5 w-5 transition-transform', !isOpen && 'rotate-180')}
            />
        </Button>
    </div>
  );
}
