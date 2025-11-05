/**
 * useChatInput Hook
 *
 * Centralizes all input-related logic for the chat interface.
 * Manages input state, textarea auto-sizing, debouncing, and draft persistence.
 *
 * Features:
 * - Input state management with localStorage persistence
 * - Textarea auto-sizing (2 rows → auto-expand)
 * - Input debouncing for performance
 * - Cursor position tracking
 * - Voice transcript integration
 */

import { useState, useEffect, useRef, useCallback } from "react";
import safeLocalStorage from "~/utils/safeLocalStorage";

export function useChatInput({ selectedProject }) {
  // Input state
  const [input, setInput] = useState(() => {
    if (typeof window !== "undefined" && selectedProject) {
      return safeLocalStorage.getItem(`draft_input_${selectedProject.name}`) || "";
    }
    return "";
  });
  const [debouncedInput, setDebouncedInput] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isTextareaExpanded, setIsTextareaExpanded] = useState(false);

  // Refs
  const textareaRef = useRef(null);
  const inputContainerRef = useRef(null);

  // Debounced input (150ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(input);
    }, 150);

    return () => clearTimeout(timer);
  }, [input]);

  // Persist input draft to localStorage
  useEffect(() => {
    if (selectedProject && input !== "") {
      safeLocalStorage.setItem(`draft_input_${selectedProject.name}`, input);
    } else if (selectedProject && input === "") {
      safeLocalStorage.removeItem(`draft_input_${selectedProject.name}`);
    }
  }, [input, selectedProject]);

  // Load saved state when project changes
  useEffect(() => {
    if (selectedProject) {
      const savedInput = safeLocalStorage.getItem(`draft_input_${selectedProject.name}`) || "";
      if (savedInput !== input) {
        setInput(savedInput);
      }
    }
  }, [selectedProject?.name]);

  // Initial textarea setup - set to 2 rows height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";

      // Check if initially expanded
      const lineHeight = parseInt(window.getComputedStyle(textareaRef.current).lineHeight);
      const isExpanded = textareaRef.current.scrollHeight > lineHeight * 2;
      setIsTextareaExpanded(isExpanded);
    }
  }, []);

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (textareaRef.current && !input.trim()) {
      textareaRef.current.style.height = "auto";
      setIsTextareaExpanded(false);
    }
  }, [input]);

  // Update textarea height
  const updateTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";

      const lineHeight = parseInt(window.getComputedStyle(textareaRef.current).lineHeight);
      const isExpanded = textareaRef.current.scrollHeight > lineHeight * 2;
      setIsTextareaExpanded(isExpanded);
    }
  }, []);

  // Handle voice transcript
  const handleTranscript = useCallback(
    (text) => {
      if (text.trim()) {
        setInput((prevInput) => {
          const newInput = prevInput.trim() ? `${prevInput} ${text}` : text;

          // Update textarea height after setting new content
          setTimeout(() => {
            updateTextareaHeight();
          }, 0);

          return newInput;
        });
      }
    },
    [updateTextareaHeight]
  );

  // Handle textarea click (update cursor position)
  const handleTextareaClick = useCallback((e) => {
    setCursorPosition(e.target.selectionStart);
  }, []);

  // Clear input (e.g., after message send)
  const clearInput = useCallback(() => {
    setInput("");
    setIsTextareaExpanded(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    if (selectedProject) {
      safeLocalStorage.removeItem(`draft_input_${selectedProject.name}`);
    }
  }, [selectedProject]);

  return {
    // State
    input,
    setInput,
    debouncedInput,
    cursorPosition,
    setCursorPosition,
    isInputFocused,
    setIsInputFocused,
    isTextareaExpanded,
    setIsTextareaExpanded,

    // Refs
    textareaRef,
    inputContainerRef,

    // Methods
    handleTranscript,
    handleTextareaClick,
    clearInput,
    updateTextareaHeight,
  };
}
