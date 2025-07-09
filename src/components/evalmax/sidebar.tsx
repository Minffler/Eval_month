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
  LayoutDashboard,
  FileCheck,
  Eye,
  Database,
  Upload,
  Users,
  Settings,
  Bot,
  ChevronLeft,
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: NavItem[];
};

const navItems: NavItem[] = [
  {
    id: 'results',
    label: '평가결과',
    icon: FileCheck,
    children: [
      { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
      { id: 'all-results', label: '전체 결과', icon: FileCheck },
      { id: 'evaluator-view', label: '평가자별 결과', icon: Eye },
      { id: 'consistency-check', label: '편향 검토 (AI)', icon: Bot },
    ],
  },
  {
    id: 'data-management',
    label: '데이터 관리',
    icon: Database,
    children: [
      { id: 'file-upload', label: '파일 업로드', icon: Upload },
      { id: 'evaluator-management', label: '평가자 관리', icon: Users },
      { id: 'grade-management', label: '등급/점수 관리', icon: Settings },
    ],
  },
];

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ activeView, setActiveView, isOpen, setIsOpen }: SidebarProps) {
  const [openAccordion, setOpenAccordion] = React.useState<string[]>(['results', 'data-management']);

  const handleNavClick = (id: string, hasChildren: boolean) => {
    if (!hasChildren) {
      setActiveView(id);
    }
  };

  const NavLink = ({ item }: { item: NavItem }) => (
    <Button
      variant={activeView === item.id ? 'secondary' : 'ghost'}
      className={cn("w-full justify-start gap-3", !isOpen && "justify-center")}
      onClick={() => handleNavClick(item.id, !!item.children)}
      title={item.label}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      {isOpen && <span className="truncate">{item.label}</span>}
    </Button>
  );

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-20 h-full flex-shrink-0 border-r bg-card transition-all duration-300 ease-in-out',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
        <div className="flex h-16 items-center justify-between border-b px-4">
          {isOpen && <h2 className="text-lg font-bold truncate">PL월성과평가</h2>}
        </div>
        <ScrollArea className="h-[calc(100%-4rem)]">
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
