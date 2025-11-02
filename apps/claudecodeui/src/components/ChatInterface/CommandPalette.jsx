import React from 'react';
import { useCommands } from '../../hooks/useCommands';

/**
 * CommandPalette - Encapsulates all slash command functionality
 *
 * Manages command detection, filtering, execution, and UI rendering.
 * Provides a clean interface to ChatInterface via props and callbacks.
 */
function CommandPalette({
  // Required context
  selectedProject,
  input,
  setInput,
  currentSessionId,
  provider,
  tokenBudget,

  // Message management
  setChatMessages,
  setSessionMessages,

  // Callbacks
  handleSubmitRef,
  onFileOpen,
  onShowSettings,

  // Children (render prop pattern for UI customization)
  children
}) {
  const {
    showCommandMenu,
    filteredCommands,
    selectedCommandIndex,
    slashPosition,
    frequentCommands,
    slashCommands,
    commandQuery,
    setShowCommandMenu,
    setCommandQuery,
    setSelectedCommandIndex,
    setSlashPosition,
    setFilteredCommands,
    handleCommandSelect,
    selectCommand,
    handleCommandKeyDown,
    detectSlashCommand,
    commandQueryTimerRef
  } = useCommands({
    selectedProject,
    input,
    setInput,
    currentSessionId,
    provider,
    tokenBudget,
    setChatMessages,
    setSessionMessages,
    handleSubmitRef,
    onFileOpen,
    onShowSettings
  });

  // Provide all command state and handlers to children via render prop
  if (typeof children === 'function') {
    return children({
      // State
      showCommandMenu,
      filteredCommands,
      selectedCommandIndex,
      slashPosition,
      frequentCommands,
      slashCommands,
      commandQuery,

      // Setters
      setShowCommandMenu,
      setCommandQuery,
      setSelectedCommandIndex,
      setSlashPosition,
      setFilteredCommands,

      // Handlers
      handleCommandSelect,
      selectCommand,
      handleCommandKeyDown,
      detectSlashCommand,

      // Refs
      commandQueryTimerRef
    });
  }

  // If no children, just provide the state via a container
  return null;
}

export default CommandPalette;
