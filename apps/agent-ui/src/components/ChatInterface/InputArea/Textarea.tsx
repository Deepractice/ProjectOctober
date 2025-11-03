import React from 'react';
import CommandMenu from '../../CommandMenu';
import ActionButtons from './ActionButtons';

/**
 * Textarea component - Main input textarea with file dropdown and command menu
 * @param {Object} props
 * @param {React.RefObject} props.textareaRef - Ref for the textarea element
 * @param {string} props.value - Current input value
 * @param {boolean} props.isLoading - Whether request is loading
 * @param {boolean} props.isExpanded - Whether textarea is expanded
 * @param {boolean} props.isInputFocused - Whether input is focused
 * @param {boolean} props.sendByCtrlEnter - Send mode preference
 * @param {boolean} props.showFileDropdown - Whether file dropdown is visible
 * @param {Array} props.filteredFiles - Filtered files for autocomplete
 * @param {number} props.selectedFileIndex - Selected file index
 * @param {boolean} props.showCommandMenu - Whether command menu is visible
 * @param {Array} props.filteredCommands - Filtered commands
 * @param {number} props.selectedCommandIndex - Selected command index
 * @param {Array} props.slashCommands - All slash commands
 * @param {Array} props.frequentCommands - Frequently used commands
 * @param {string} props.commandQuery - Current command query
 * @param {Object} props.dropzoneProps - Dropzone props from react-dropzone
 * @param {Function} props.onChange - Input change handler
 * @param {Function} props.onClick - Input click handler
 * @param {Function} props.onKeyDown - Key down handler
 * @param {Function} props.onPaste - Paste handler
 * @param {Function} props.onFocus - Focus handler
 * @param {Function} props.onBlur - Blur handler
 * @param {Function} props.onInput - Input event handler
 * @param {Function} props.onSelectFile - File selection handler
 * @param {Function} props.onSubmit - Form submit handler
 * @param {Function} props.onImageUpload - Image upload handler
 * @param {Function} props.onToggleCommandMenu - Toggle command menu handler
 * @param {Function} props.onCommandSelect - Command selection handler
 * @param {Function} props.onCloseCommandMenu - Close command menu handler
 * @param {Function} props.onTranscript - Voice transcript handler
 */
function Textarea({
  textareaRef,
  value = '',
  isLoading = false,
  isExpanded = false,
  isInputFocused = false,
  sendByCtrlEnter = false,
  showFileDropdown = false,
  filteredFiles = [],
  selectedFileIndex = -1,
  showCommandMenu = false,
  filteredCommands = [],
  selectedCommandIndex = -1,
  slashCommands = [],
  frequentCommands = [],
  commandQuery = '',
  dropzoneProps = { getRootProps: () => ({}), getInputProps: () => ({}), isDragActive: false, open: () => {} },
  onChange,
  onClick,
  onKeyDown,
  onPaste,
  onFocus,
  onBlur,
  onInput,
  onSelectFile,
  onSubmit,
  onImageUpload,
  onToggleCommandMenu,
  onCommandSelect,
  onCloseCommandMenu,
  onTranscript
}) {
  return (
    <>
      {/* File dropdown - positioned outside dropzone to avoid conflicts */}
      {showFileDropdown && filteredFiles.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 backdrop-blur-sm">
          {filteredFiles.map((file, index) => (
            <div
              key={file.path}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 touch-manipulation ${
                index === selectedFileIndex
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectFile(file);
              }}
            >
              <div className="font-medium text-sm">{file.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {file.path}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Command Menu */}
      <CommandMenu
        commands={filteredCommands}
        selectedIndex={selectedCommandIndex}
        onSelect={onCommandSelect}
        onClose={onCloseCommandMenu}
        position={{
          top: textareaRef.current
            ? Math.max(16, textareaRef.current.getBoundingClientRect().top - 316)
            : 0,
          left: textareaRef.current
            ? textareaRef.current.getBoundingClientRect().left
            : 16,
          bottom: textareaRef.current
            ? window.innerHeight - textareaRef.current.getBoundingClientRect().top + 8
            : 90
        }}
        isOpen={showCommandMenu}
        frequentCommands={commandQuery ? [] : frequentCommands}
      />

      {/* Input container with dropzone */}
      <div
        {...dropzoneProps.getRootProps()}
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200 overflow-hidden ${
          isExpanded ? 'chat-input-expanded' : ''
        }`}
      >
        <input {...dropzoneProps.getInputProps()} />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onClick={onClick}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onFocus={onFocus}
          onBlur={onBlur}
          onInput={onInput}
          placeholder="Type / for commands, @ for files, or ask Agent anything..."
          disabled={isLoading}
          className="chat-input-placeholder block w-full pl-12 pr-20 sm:pr-40 py-1.5 sm:py-4 bg-transparent rounded-2xl focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 resize-none min-h-[50px] sm:min-h-[80px] max-h-[40vh] sm:max-h-[300px] overflow-y-auto text-sm sm:text-base leading-[21px] sm:leading-6 transition-all duration-200"
          style={{ height: '50px' }}
        />

        {/* Action Buttons */}
        <ActionButtons
          onImageUpload={onImageUpload}
          onToggleCommandMenu={onToggleCommandMenu}
          showCommandMenu={showCommandMenu}
          commandCount={slashCommands.length}
          onSubmit={onSubmit}
          isLoading={isLoading}
          hasInput={!!value.trim()}
          onTranscript={onTranscript}
        />

        {/* Hint text inside input box at bottom */}
        <div className="absolute bottom-1 left-12 right-14 sm:right-40 text-xs text-gray-400 dark:text-gray-500 pointer-events-none hidden sm:block">
          {sendByCtrlEnter
            ? "Ctrl+Enter to send • Shift+Enter for new line • Tab to change modes • / for slash commands"
            : "Enter to send • Shift+Enter for new line • Tab to change modes • / for slash commands"}
        </div>
        <div
          className={`absolute bottom-1 left-12 right-14 text-xs text-gray-400 dark:text-gray-500 pointer-events-none sm:hidden transition-opacity duration-200 ${
            isInputFocused ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {sendByCtrlEnter
            ? "Ctrl+Enter to send • Tab for modes • / for commands"
            : "Enter to send • Tab for modes • / for commands"}
        </div>
      </div>
    </>
  );
}

export default Textarea;
