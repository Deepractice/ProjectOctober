/**
 * useChatScrolling Hook
 *
 * Centralizes all scroll-related logic for the chat interface.
 * Reduces ChatInterface complexity by extracting 5 useEffect hooks and 3 callbacks.
 *
 * Features:
 * - Auto-scroll to bottom for new messages
 * - Manual scroll detection (user scrolled up)
 * - Infinite scroll (load more messages when scrolling to top)
 * - Scroll position preservation when auto-scroll is disabled
 * - Smart scroll restore after loading more messages
 */

import { useState, useRef, useCallback, useEffect } from "react";

interface UseChatScrollingProps {
  chatMessages: any[];
  autoScrollToBottom: boolean;
  hasMoreMessages: boolean;
  isLoadingMoreMessages: boolean;
  selectedSession: any;
  selectedProject: any;
  loadSessionMessages: (sessionId: string, loadMore: boolean) => Promise<any[]>;
  setSessionMessages: React.Dispatch<React.SetStateAction<any[]>>;
  isLoadingSessionRef: React.MutableRefObject<boolean>;
}

export function useChatScrolling({
  chatMessages,
  autoScrollToBottom,
  hasMoreMessages,
  isLoadingMoreMessages,
  selectedSession,
  selectedProject,
  loadSessionMessages,
  setSessionMessages,
  isLoadingSessionRef,
}: UseChatScrollingProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const scrollPositionRef = useRef({ height: 0, top: 0 });

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      setIsUserScrolledUp(false);
    }
  }, []);

  // Check if near bottom (within 50px)
  const isNearBottom = useCallback(() => {
    if (!scrollContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  // Handle scroll events: detect manual scroll up + load more messages
  const handleScroll = useCallback(async () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const nearBottom = isNearBottom();
    setIsUserScrolledUp(!nearBottom);

    // Load more messages when scrolling near top
    const scrolledNearTop = container.scrollTop < 100;
    const provider = localStorage.getItem("selected-provider") || "claude";

    if (
      scrolledNearTop &&
      hasMoreMessages &&
      !isLoadingMoreMessages &&
      selectedSession &&
      selectedProject &&
      provider !== "cursor"
    ) {
      // Save current scroll position
      const previousScrollHeight = container.scrollHeight;
      const previousScrollTop = container.scrollTop;

      // Load more messages
      const moreMessages = await loadSessionMessages(selectedSession.id, true);

      if (moreMessages.length > 0) {
        // Prepend new messages
        setSessionMessages((prev) => [...moreMessages, ...prev]);

        // Restore scroll position after DOM update
        setTimeout(() => {
          if (scrollContainerRef.current) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            const scrollDiff = newScrollHeight - previousScrollHeight;
            scrollContainerRef.current.scrollTop = previousScrollTop + scrollDiff;
          }
        }, 0);
      }
    }
  }, [
    isNearBottom,
    hasMoreMessages,
    isLoadingMoreMessages,
    selectedSession,
    selectedProject,
    loadSessionMessages,
    setSessionMessages,
  ]);

  // Capture scroll position before render when auto-scroll is disabled
  useEffect(() => {
    if (!autoScrollToBottom && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      scrollPositionRef.current = {
        height: container.scrollHeight,
        top: container.scrollTop,
      };
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!scrollContainerRef.current || chatMessages.length === 0) return;

    if (autoScrollToBottom) {
      // Auto-scroll enabled: scroll to bottom unless user manually scrolled up
      if (!isUserScrolledUp) {
        setTimeout(() => scrollToBottom(), 50);
      }
    } else {
      // Auto-scroll disabled: preserve visual position
      const container = scrollContainerRef.current;
      const prevHeight = scrollPositionRef.current.height;
      const prevTop = scrollPositionRef.current.top;
      const newHeight = container.scrollHeight;
      const heightDiff = newHeight - prevHeight;

      // If content was added above current view, adjust scroll position
      if (heightDiff > 0 && prevTop > 0) {
        container.scrollTop = prevTop + heightDiff;
      }
    }
  }, [chatMessages.length, isUserScrolledUp, scrollToBottom, autoScrollToBottom]);

  // Scroll to bottom when messages first load after session switch
  useEffect(() => {
    if (scrollContainerRef.current && chatMessages.length > 0 && !isLoadingSessionRef.current) {
      setIsUserScrolledUp(false);
      setTimeout(() => scrollToBottom(), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chatMessages.length intentionally excluded to avoid loop
  }, [selectedSession?.id, selectedProject?.name, scrollToBottom, isLoadingSessionRef]);

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  return {
    scrollContainerRef,
    isUserScrolledUp,
    setIsUserScrolledUp,
    scrollToBottom,
    isNearBottom,
  };
}
