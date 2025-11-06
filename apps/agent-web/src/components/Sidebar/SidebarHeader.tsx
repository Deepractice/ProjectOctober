import { MessageSquare } from "lucide-react";

interface SidebarHeaderProps {
  isMobile?: boolean;
  isPWA?: boolean;
}

export function SidebarHeader({ isMobile = false, isPWA = false }: SidebarHeaderProps) {
  return (
    <div className="md:p-4 md:border-b md:border-border">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Deepractice Agent</h1>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div
        className="md:hidden p-3 border-b border-border"
        style={isPWA && isMobile ? { paddingTop: "16px" } : {}}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Deepractice Agent</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
