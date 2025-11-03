import { useFileAutocomplete } from '../../hooks/useFileAutocomplete';

/**
 * FileAutocomplete - Encapsulates file path autocomplete functionality
 *
 * Manages @ symbol detection, file filtering, and file path insertion.
 * Provides a clean interface to ChatInterface via render prop pattern.
 */
function FileAutocomplete({
  // Required context
  input,
  cursorPosition,
  selectedProject,
  textareaRef,
  setInput,
  setCursorPosition,

  // Children (render prop pattern for UI customization)
  children
}) {
  const {
    showFileDropdown,
    filteredFiles,
    selectedFileIndex,
    atSymbolPosition,
    selectFile,
    handleFileKeyDown,
    setShowFileDropdown
  } = useFileAutocomplete({
    input,
    cursorPosition,
    selectedProject,
    textareaRef,
    setInput,
    setCursorPosition
  });

  // Provide all file autocomplete state and handlers to children via render prop
  if (typeof children === 'function') {
    return children({
      // State
      showFileDropdown,
      filteredFiles,
      selectedFileIndex,
      atSymbolPosition,

      // Handlers
      selectFile,
      handleFileKeyDown,

      // Setters
      setShowFileDropdown
    });
  }

  // If no children, just provide the state via a container
  return null;
}

export default FileAutocomplete;
