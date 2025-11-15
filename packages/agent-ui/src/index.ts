/**
 * @deepractice-ai/agent-ui
 * React components for building AI agent interfaces
 */

// UI Components (Atoms)
export { Button, buttonVariants } from "./components/ui/Button";
export { Input } from "./components/ui/Input";
export { Badge, badgeVariants } from "./components/ui/Badge";
export { ScrollArea } from "./components/ui/ScrollArea";
export { Popover, PopoverTrigger, PopoverContent } from "./components/ui/Popover";
export { AgentLogo } from "./components/ui/AgentLogo";
export { ImageAttachment } from "./components/ui/ImageAttachment";
export { TokenUsagePie } from "./components/ui/TokenUsagePie";
export { MessageAvatar, avatarVariants } from "./components/ui/MessageAvatar";
export { EmptyState } from "./components/ui/EmptyState";
export { LoadingState } from "./components/ui/LoadingState";
export { TimeAgo } from "./components/ui/TimeAgo";
export { SearchInput } from "./components/ui/SearchInput";
export { ActionBar } from "./components/ui/ActionBar";
export { AppHeader } from "./components/ui/AppHeader";
export { ListItem } from "./components/ui/ListItem";
export { TabNavigation } from "./components/ui/TabNavigation";
export type { Tab, TabNavigationProps } from "./components/ui/TabNavigation";
export { PageHeader } from "./components/ui/PageHeader";
export type { PageHeaderProps } from "./components/ui/PageHeader";
// Layout Components
export { Header } from "./components/layout/Header";
export type { HeaderProps } from "./components/layout/Header";
export { ActivityBar } from "./components/layout/ActivityBar";
export type { ActivityBarProps, ActivityBarItem } from "./components/layout/ActivityBar";
export { Sidebar } from "./components/layout/Sidebar";
export type { SidebarProps } from "./components/layout/Sidebar";
export { MainContent } from "./components/layout/MainContent";
export type { MainContentProps } from "./components/layout/MainContent";
export { Panel } from "./components/layout/Panel";
export type { PanelProps } from "./components/layout/Panel";
export { RightSidebar } from "./components/layout/RightSidebar";
export type { RightSidebarProps } from "./components/layout/RightSidebar";
export { StatusBar, StatusBarSection, StatusBarItem } from "./components/layout/StatusBar";
export type {
  StatusBarProps,
  StatusBarSectionProps,
  StatusBarItemProps,
} from "./components/layout/StatusBar";

// Content Components (Molecules)
export { JSONRenderer } from "./components/content/JSONRenderer";
export { DiffViewer } from "./components/content/DiffViewer";
export { MarkdownText } from "./components/content/MarkdownText";

// Message Components (Molecules)
export { ThinkingSection } from "./components/message/ThinkingSection";
export { UserMessage } from "./components/message/UserMessage";
export { AssistantMessage } from "./components/message/AssistantMessage";

// Chat Components (Molecules)
export { MessageBubble } from "./components/chat/MessageBubble";
export { ChatHeader } from "./components/chat/ChatHeader";
export type { ChatHeaderProps, ChatTab } from "./components/chat/ChatHeader";

// Session Components (Composite)
export { SessionItem } from "./components/session/SessionItem";
export { SessionList } from "./components/session/SessionList";
export { SessionSearchBar } from "./components/session/SessionSearchBar";
export { SessionSidebar } from "./components/session/SessionSidebar";
export type { SessionData } from "./components/session/SessionItem";

// Utilities
export { cn, decodeHtmlEntities, formatUsageLimitText } from "./lib/utils";
export { formatTimeAgo } from "./lib/timeUtils";
export { eventBus } from "./lib/eventBus";
export type { AppEvents } from "./lib/eventBus";

// Styles
import "./styles/globals.css";
