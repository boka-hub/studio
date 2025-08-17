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
  title: string;
  icon: ElementType;
  actions: HeaderAction[];
  onTitleClick?: () => void;
}

export const Header: FC<HeaderProps> = ({ title, icon: Icon, actions, onTitleClick }) => {

  return (
    <header className="flex items-center justify-between p-2 border-b border-border shadow-sm z-10 flex-shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
           <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={onTitleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTitleClick?.()}
          >
            <Icon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground truncate max-w-xs">{title}</h1>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>App Settings & Info</p>
        </TooltipContent>
      </Tooltip>
      <div className="flex items-center gap-1">
        {actions.map((action, index) => (
          <Tooltip key={index}>
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
      </div>
    </header>
  );
};
