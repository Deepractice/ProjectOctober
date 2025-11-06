/**
 * Main Application Layout
 * Two-column layout: Sessions sidebar + Chat area
 */

import { ReactNode } from "react";

interface LayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export function Layout({ sidebar, main }: LayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar - Session List */}
      <aside className="w-64 border-r border-border flex-shrink-0 overflow-y-auto">{sidebar}</aside>

      {/* Main Content - Chat Area */}
      <main className="flex-1 overflow-hidden">{main}</main>
    </div>
  );
}
