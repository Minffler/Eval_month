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
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
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
  const { unreadCount } = useNotifications();

  React.useEffect(() => {
    if (isOpen) {
      setOpenAccordion(navItems.map(item => item.id));
    }
  }, [isOpen, navItems]);

  const handleNavClick = (id: string, hasChildren: boolean) => {
    if (!hasChildren) {
      setActiveView(id);
    }
  };

  const NavLink = ({ item, hasUnread }: { item: NavItem, hasUnread: boolean }) => (
    <Button
      variant={activeView === item.id ? 'secondary' : 'ghost'}
      className={cn("w-full justify-start gap-3", !isOpen && "justify-center")}
      onClick={() => handleNavClick(item.id, !!item.children)}
      title={item.label}
    >
        <div className="relative">
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {hasUnread && (
                <span className={cn("absolute top-0 right-0 flex h-2.5 w-2.5", isOpen ? "-mr-1" : "-mt-0.5 -mr-0.5")}>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
            )}
        </div>
      {isOpen && <span className="truncate">{item.label}</span>}
    </Button>
  );
  
  const userProfile = user ? (
    <div className="flex items-center gap-3 p-4">
      <Avatar className={cn("h-10 w-10 transition-all", !isOpen && "h-9 w-9")}>
        <AvatarImage src={user?.avatar} alt={user?.name} data-ai-hint="person avatar" />
        <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
      </Avatar>
      {isOpen && (
        <div className="flex flex-col text-left overflow-hidden">
            <span className="font-semibold text-sm truncate">{user?.name}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.department} / {user?.title}</span>
        </div>
      )}
    </div>
  ) : null;

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
                const isNotificationItem = item.id === 'notifications';
                const hasUnread = unreadCount > 0 && isNotificationItem;

                if (!item.children) {
                  return <NavLink key={item.id} item={item} hasUnread={hasUnread} />;
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
                                <NavLink key={child.id} item={child} hasUnread={false} />
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
          <Popover>
            <PopoverTrigger asChild>
              <div className="cursor-pointer hover:bg-muted/50">
                {userProfile}
              </div>
            </PopoverTrigger>
            <PopoverContent side={isOpen ? 'top' : 'right'} align="start" className="w-auto mb-2">
              <div className="p-2 space-y-1">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.department} / {user?.title}</p>
              </div>
            </PopoverContent>
          </Popover>

          <div className="p-2 border-t">
            <Button variant="ghost" onClick={logout} className={cn("w-full justify-start gap-3", !isOpen && "justify-center")} title="로그아웃">
              <LogOut className="h-5 w-5" />
              {isOpen && <span>로그아웃</span>}
            </Button>
          </div>
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
