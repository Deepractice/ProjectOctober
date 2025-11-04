import { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";

/**
 * Custom hook for file autocomplete functionality
 * Handles @ symbol detection and file path suggestions
 *
 * @param {Object} params - Hook parameters
 * @param {string} params.input - Current input text
 * @param {number} params.cursorPosition - Current cursor position
 * @param {Object} params.selectedProject - Currently selected project
 * @param {React.RefObject} params.textareaRef - Reference to textarea element
 * @param {Function} params.setInput - Function to update input
 * @param {Function} params.setCursorPosition - Function to update cursor position
 * @returns {Object} File autocomplete state and handlers
 */
export const useFileAutocomplete = ({
  input,
  cursorPosition,
  selectedProject,
  textareaRef,
  setInput,
  setCursorPosition,
}) => {
  const [showFileDropdown, setShowFileDropdown] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(-1);
  const [atSymbolPosition, setAtSymbolPosition] = useState(-1);

  // Load file list when project changes
  useEffect(() => {
    if (selectedProject) {
      fetchProjectFiles();
    }
  }, [selectedProject]);

  const fetchProjectFiles = async () => {
    try {
      const response = await api.getFiles();
      if (response.ok) {
        const files = await response.json();
        // Flatten the file tree to get all file paths
        const flatFiles = flattenFileTree(files);
        setFileList(flatFiles);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const flattenFileTree = (files, basePath = "") => {
    let result = [];
    for (const file of files) {
      const fullPath = basePath ? `${basePath}/${file.name}` : file.name;
      if (file.type === "directory" && file.children) {
        result = result.concat(flattenFileTree(file.children, fullPath));
      } else if (file.type === "file") {
        result.push({
          name: file.name,
          path: fullPath,
          relativePath: file.path,
        });
      }
    }
    return result;
  };

  // Handle @ symbol detection and file filtering
  useEffect(() => {
    const textBeforeCursor = input.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's a space after the @ symbol (which would end the file reference)
      if (!textAfterAt.includes(" ")) {
        setAtSymbolPosition(lastAtIndex);
        setShowFileDropdown(true);

        // Filter files based on the text after @
        const filtered = fileList
          .filter(
            (file) =>
              file.name.toLowerCase().includes(textAfterAt.toLowerCase()) ||
              file.path.toLowerCase().includes(textAfterAt.toLowerCase())
          )
          .slice(0, 10); // Limit to 10 results

        setFilteredFiles(filtered);
        setSelectedFileIndex(-1);
      } else {
        setShowFileDropdown(false);
        setAtSymbolPosition(-1);
      }
    } else {
      setShowFileDropdown(false);
      setAtSymbolPosition(-1);
    }
  }, [input, cursorPosition, fileList]);

  const selectFile = useCallback(
    (file) => {
      const textBeforeAt = input.slice(0, atSymbolPosition);
      const textAfterAtQuery = input.slice(atSymbolPosition);
      const spaceIndex = textAfterAtQuery.indexOf(" ");
      const textAfterQuery = spaceIndex !== -1 ? textAfterAtQuery.slice(spaceIndex) : "";

      const newInput = textBeforeAt + "@" + file.path + " " + textAfterQuery;
      const newCursorPos = textBeforeAt.length + 1 + file.path.length + 1;

      // Immediately ensure focus is maintained
      if (textareaRef.current && !textareaRef.current.matches(":focus")) {
        textareaRef.current.focus();
      }

      // Update input and cursor position
      setInput(newInput);
      setCursorPosition(newCursorPos);

      // Hide dropdown
      setShowFileDropdown(false);
      setAtSymbolPosition(-1);

      // Set cursor position synchronously
      if (textareaRef.current) {
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            // Ensure focus is maintained
            if (!textareaRef.current.matches(":focus")) {
              textareaRef.current.focus();
            }
          }
        });
      }
    },
    [input, atSymbolPosition, textareaRef, setInput, setCursorPosition]
  );

  const handleFileKeyDown = useCallback(
    (e) => {
      // Handle file dropdown navigation
      if (showFileDropdown && filteredFiles.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedFileIndex((prev) => (prev < filteredFiles.length - 1 ? prev + 1 : 0));
          return true;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedFileIndex((prev) => (prev > 0 ? prev - 1 : filteredFiles.length - 1));
          return true;
        }
        if (e.key === "Tab" || e.key === "Enter") {
          e.preventDefault();
          if (selectedFileIndex >= 0) {
            selectFile(filteredFiles[selectedFileIndex]);
          } else if (filteredFiles.length > 0) {
            selectFile(filteredFiles[0]);
          }
          return true;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setShowFileDropdown(false);
          return true;
        }
      }
      return false;
    },
    [showFileDropdown, filteredFiles, selectedFileIndex, selectFile]
  );

  return {
    showFileDropdown,
    filteredFiles,
    selectedFileIndex,
    atSymbolPosition,
    selectFile,
    handleFileKeyDown,
    setShowFileDropdown,
  };
};
