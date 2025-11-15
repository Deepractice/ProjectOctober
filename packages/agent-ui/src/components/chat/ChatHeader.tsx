import * as React from "react";
import { MessageSquare, Terminal, Folder } from "lucide-react";
import { PageHeader } from "../ui/PageHeader";
import { TabNavigation, type Tab } from "../ui/TabNavigation";
import { Button } from "../ui/Button";

export type ChatTab = "chat" | "shell" | "files";

export interface ChatHeaderProps {
  /**
   * Session title
   */
  title: string;
  /**
   * Optional subtitle (e.g., project name)
   */
  subtitle?: string;
  /**
   * Currently active tab
   */
  activeTab: ChatTab;
  /**
   * Callback when tab changes
   */
  onTabChange: (tab: ChatTab) => void;
  /**
   * Callback when menu button is clicked (mobile)
   */
  onMenuClick?: () => void;
  /**
   * Whether in mobile mode
   * @default false
   */
  isMobile?: boolean;
  /**
   * Whether to show border at bottom
   * @default true
   */
  showBorder?: boolean;
}

const CHAT_TABS: Tab[] = [
  {
    id: "chat",
    label: "Chat",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    id: "shell",
    label: "Shell",
    icon: <Terminal className="w-4 h-4" />,
  },
  {
    id: "files",
    label: "Files",
    icon: <Folder className="w-4 h-4" />,
  },
];

/**
 * ChatHeader - Chat application header with tab navigation
 *
 * A specialized header for chat interfaces that combines session title
 * with tab navigation (Chat/Shell/Files). Includes mobile menu support
 * and responsive layout.
 *
 * This is a business component that uses PageHeader and TabNavigation
 * UI components with fixed chat-specific tabs.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ChatHeader
 *   title="New Session"
 *   activeTab="chat"
 *   onTabChange={setActiveTab}
 * />
 *
 * // With subtitle and mobile menu
 * <ChatHeader
 *   title="Agent Conversation"
 *   subtitle="deepractice-ai/project"
 *   activeTab="chat"
 *   onTabChange={setActiveTab}
 *   onMenuClick={toggleSidebar}
 *   isMobile
 * />
 *
 * // Complete example
 * function ChatApp() {
 *   const [activeTab, setActiveTab] = useState<ChatTab>("chat");
 *   const [sidebarOpen, setSidebarOpen] = useState(false);
 *
 *   return (
 *     <ChatHeader
 *       title={session?.title || "New Session"}
 *       subtitle={project?.name}
 *       activeTab={activeTab}
 *       onTabChange={setActiveTab}
 *       onMenuClick={() => setSidebarOpen(true)}
 *       isMobile={isMobile}
 *     />
 *   );
 * }
 * ```
 */
export const ChatHeader = React.forwardRef<HTMLDivElement, ChatHeaderProps>(
  (
    { title, subtitle, activeTab, onTabChange, onMenuClick, isMobile = false, showBorder = true },
    ref
  ) => {
    return (
      <PageHeader
        ref={ref}
        title={title}
        subtitle={subtitle}
        showBorder={showBorder}
        isMobile={isMobile}
        leading={
          onMenuClick ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className={isMobile ? "h-8 w-8" : "h-9 w-9"}
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          ) : undefined
        }
        trailing={
          <TabNavigation
            tabs={CHAT_TABS}
            activeTab={activeTab}
            onTabChange={(tabId) => onTabChange(tabId as ChatTab)}
            iconOnlyMobile
          />
        }
      />
    );
  }
);

ChatHeader.displayName = "ChatHeader";
