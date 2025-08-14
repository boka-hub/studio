import type { FC, ElementType } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from './ui/separator';

interface HeaderAction {
  icon: ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface HeaderProps {
  title: string;
  icon: ElementType;
  actions: HeaderAction[];
  onTitleClick?: () => void;
}

export const Header: FC<HeaderProps> = ({ title, icon: Icon, actions, onTitleClick }) => {
  const mainActions = actions.slice(0, 5);
  const undoRedoActions = actions.slice(5);

  return (
    <header className="flex items-center justify-between p-2 border-b border-border shadow-sm">
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={onTitleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTitleClick?.()}
      >
        <Icon className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-1">
        {mainActions.map((action, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <div
                className="inline-block"
                tabIndex={action.disabled ? -1 : undefined}
                style={{ pointerEvents: action.disabled ? 'none' : 'auto' }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  aria-label={action.label}
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
        <Separator orientation="vertical" className="h-6 mx-1" />
        {undoRedoActions.map((action, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <div
                className="inline-block"
                tabIndex={action.disabled ? -1 : undefined}
                style={{ pointerEvents: action.disabled ? 'none' : 'auto' }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  aria-label={action.label}
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
