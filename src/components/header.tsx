
import React from 'react';
import type { FC, ElementType } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from './ui/separator';

interface HeaderAction {
  icon: ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  icon: ElementType;
  actionGroups: HeaderAction[][];
  onTitleClick?: () => void;
}

export const Header: FC<HeaderProps> = ({ title = "TileForge", subtitle, icon: Icon, actionGroups, onTitleClick }) => {

  return (
    <header className="flex items-center justify-between p-2 border-b border-border shadow-sm z-10 flex-shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
           <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={onTitleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTitleClick?.()}
          >
            <Icon className="h-7 w-7 text-primary" />
            <div className="flex flex-col">
                <h1 className="text-xl font-bold text-foreground leading-tight">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground leading-tight">{subtitle}</p>}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Manage Projects (Ctrl+P)</p>
        </TooltipContent>
      </Tooltip>
      <div className="flex items-center gap-1">
        {actionGroups.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
                {group.map((action, actionIndex) => (
                <Tooltip key={`${groupIndex}-${actionIndex}`}>
                    <TooltipTrigger asChild>
                    <div
                        className="inline-block"
                        tabIndex={action.disabled ? -1 : undefined}
                        style={{ pointerEvents: action.disabled ? 'none' : 'auto' }}
                    >
                        <Button
                        variant={action.isActive ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={action.onClick}
                        disabled={action.disabled}
                        aria-label={action.label}
                        className={action.isActive ? 'bg-primary/20' : ''}
                        >
                        <action.icon className="h-5 w-5" />
                        </Button>
                    </div>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>{action.label}</p>
                    </TooltipContent>
                </Tooltip>
                ))}
                {groupIndex < actionGroups.length - 1 && <Separator orientation="vertical" className="h-6 mx-1" />}
            </React.Fragment>
        ))}
      </div>
    </header>
  );
};

    
