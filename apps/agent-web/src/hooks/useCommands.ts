import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Fuse from "fuse.js";
import { authenticatedFetch } from "~/utils/api";
import safeLocalStorage from "~/utils/safeLocalStorage";

/**
 * Custom hook for managing slash commands functionality
 * Handles command discovery, filtering, history, and execution
 */
export const useCommands = ({
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
  onShowSettings,
}) => {
  // State
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [slashCommands, setSlashCommands] = useState([]);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const [commandQuery, setCommandQuery] = useState("");
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(-1);
  const [slashPosition, setSlashPosition] = useState(-1);

  // Refs
  const commandQueryTimerRef = useRef(null);

  // Fetch slash commands on mount and when project changes
  useEffect(() => {
    const fetchCommands = async () => {
      if (!selectedProject) return;

      try {
        const response = await authenticatedFetch("/api/commands/list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectPath: selectedProject.path,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch commands");
        }

        const data = await response.json();

        // Combine built-in and custom commands
        const allCommands = [
          ...(data.builtIn || []).map((cmd) => ({ ...cmd, type: "built-in" })),
          ...(data.custom || []).map((cmd) => ({ ...cmd, type: "custom" })),
        ];

        setSlashCommands(allCommands);

        // Load command history from localStorage
        const historyKey = `command_history_${selectedProject.name}`;
        const history = safeLocalStorage.getItem(historyKey);
        if (history) {
          try {
            const parsedHistory = JSON.parse(history);
            // Sort commands by usage frequency
            const sortedCommands = allCommands.sort((a, b) => {
              const aCount = parsedHistory[a.name] || 0;
              const bCount = parsedHistory[b.name] || 0;
              return bCount - aCount;
            });
            setSlashCommands(sortedCommands);
          } catch (e) {
            console.error("Error parsing command history:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching slash commands:", error);
        setSlashCommands([]);
      }
    };

    fetchCommands();
  }, [selectedProject]);

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => {
    if (!slashCommands.length) return null;

    return new Fuse(slashCommands, {
      keys: [
        { name: "name", weight: 2 },
        { name: "description", weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 1,
    });
  }, [slashCommands]);

  // Filter commands based on query
  useEffect(() => {
    if (!commandQuery) {
      setFilteredCommands(slashCommands);
      return;
    }

    if (!fuse) {
      setFilteredCommands([]);
      return;
    }

    const results = fuse.search(commandQuery);
    setFilteredCommands(results.map((result) => result.item));
  }, [commandQuery, slashCommands, fuse]);

  // Calculate frequently used commands
  const frequentCommands = useMemo(() => {
    if (!selectedProject || slashCommands.length === 0) return [];

    const historyKey = `command_history_${selectedProject.name}`;
    const history = safeLocalStorage.getItem(historyKey);

    if (!history) return [];

    try {
      const parsedHistory = JSON.parse(history);

      // Sort commands by usage count
      const commandsWithUsage = slashCommands
        .map((cmd) => ({
          ...cmd,
          usageCount: parsedHistory[cmd.name] || 0,
        }))
        .filter((cmd) => cmd.usageCount > 0)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5); // Top 5 most used

      return commandsWithUsage;
    } catch (e) {
      console.error("Error parsing command history:", e);
      return [];
    }
  }, [selectedProject, slashCommands]);

  // Handle built-in command actions
  const handleBuiltInCommand = useCallback(
    (result) => {
      const { action, data } = result;

      switch (action) {
        case "clear":
          // Clear conversation history
          setChatMessages([]);
          setSessionMessages([]);
          break;

        case "help":
          // Show help content
          setChatMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.content,
              timestamp: Date.now(),
            },
          ]);
          break;

        case "model":
          // Show model information
          setChatMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `**Current Model**: ${data.current.model}\n\n**Available Models**:\n\nAgent: ${data.available.claude.join(", ")}\n\nCursor: ${data.available.cursor.join(", ")}`,
              timestamp: Date.now(),
            },
          ]);
          break;

        case "cost": {
          const costMessage = `**Token Usage**: ${data.tokenUsage.used.toLocaleString()} / ${data.tokenUsage.total.toLocaleString()} (${data.tokenUsage.percentage}%)\n\n**Estimated Cost**:\n- Input: $${data.cost.input}\n- Output: $${data.cost.output}\n- **Total**: $${data.cost.total}\n\n**Model**: ${data.model}`;
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: costMessage, timestamp: Date.now() },
          ]);
          break;
        }

        case "status": {
          const statusMessage = `**System Status**\n\n- Version: ${data.version}\n- Uptime: ${data.uptime}\n- Model: ${data.model}\n- Provider: ${data.provider}\n- Node.js: ${data.nodeVersion}\n- Platform: ${data.platform}`;
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: statusMessage, timestamp: Date.now() },
          ]);
          break;
        }
        case "memory":
          // Show memory file info
          if (data.error) {
            setChatMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `⚠️ ${data.message}`,
                timestamp: Date.now(),
              },
            ]);
          } else {
            setChatMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `📝 ${data.message}\n\nPath: \`${data.path}\``,
                timestamp: Date.now(),
              },
            ]);
            // Optionally open file in editor
            if (data.exists && onFileOpen) {
              onFileOpen(data.path);
            }
          }
          break;

        case "config":
          // Open settings
          if (onShowSettings) {
            onShowSettings();
          }
          break;

        case "rewind":
          // Rewind conversation
          if (data.error) {
            setChatMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `⚠️ ${data.message}`,
                timestamp: Date.now(),
              },
            ]);
          } else {
            // Remove last N messages
            setChatMessages((prev) => prev.slice(0, -data.steps * 2)); // Remove user + assistant pairs
            setChatMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `⏪ ${data.message}`,
                timestamp: Date.now(),
              },
            ]);
          }
          break;

        default:
          console.warn("Unknown built-in command action:", action);
      }
    },
    [setChatMessages, setSessionMessages, onFileOpen, onShowSettings]
  );

  // Handle custom command execution
  const handleCustomCommand = useCallback(
    async (result, args) => {
      const { content, hasBashCommands, hasFileIncludes } = result;

      // Show confirmation for bash commands
      if (hasBashCommands) {
        const confirmed = window.confirm(
          "This command contains bash commands that will be executed. Do you want to proceed?"
        );
        if (!confirmed) {
          setChatMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "❌ Command execution cancelled",
              timestamp: Date.now(),
            },
          ]);
          return;
        }
      }

      // Set the input to the command content
      setInput(content);

      // Wait for state to update, then directly call handleSubmit
      setTimeout(() => {
        if (handleSubmitRef.current) {
          // Create a fake event to pass to handleSubmit
          const fakeEvent = { preventDefault: () => {} };
          handleSubmitRef.current(fakeEvent);
        }
      }, 50);
    },
    [setInput, setChatMessages, handleSubmitRef]
  );

  // Execute a command
  const executeCommand = useCallback(
    async (command) => {
      if (!command || !selectedProject) return;

      try {
        // Parse command and arguments from current input
        const commandMatch = input.match(new RegExp(`${command.name}\\s*(.*)`));
        const args = commandMatch && commandMatch[1] ? commandMatch[1].trim().split(/\s+/) : [];

        // Prepare context for command execution
        const context = {
          projectPath: selectedProject.path,
          projectName: selectedProject.name,
          sessionId: currentSessionId,
          provider,
          model: "claude-sonnet-4.5",
          tokenUsage: tokenBudget,
        };

        // Call the execute endpoint
        const response = await authenticatedFetch("/api/commands/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            commandName: command.name,
            commandPath: command.path,
            args,
            context,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to execute command");
        }

        const result = await response.json();

        // Handle built-in commands
        if (result.type === "builtin") {
          handleBuiltInCommand(result);
        } else if (result.type === "custom") {
          // Handle custom commands - inject as system message
          await handleCustomCommand(result, args);
        }

        // Clear the input after successful execution
        setInput("");
        setShowCommandMenu(false);
        setSlashPosition(-1);
        setCommandQuery("");
        setSelectedCommandIndex(-1);
      } catch (error) {
        console.error("Error executing command:", error);
        // Show error message to user
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error executing command: ${error.message}`,
            timestamp: Date.now(),
          },
        ]);
      }
    },
    [
      input,
      selectedProject,
      currentSessionId,
      provider,
      tokenBudget,
      handleBuiltInCommand,
      handleCustomCommand,
      setInput,
      setChatMessages,
    ]
  );

  // Command selection callback with history tracking
  const handleCommandSelect = useCallback(
    (command, index, isHover) => {
      if (!command || !selectedProject) return;

      // If hovering, just update the selected index
      if (isHover) {
        setSelectedCommandIndex(index);
        return;
      }

      // Update command history
      const historyKey = `command_history_${selectedProject.name}`;
      const history = safeLocalStorage.getItem(historyKey);
      let parsedHistory = {};

      try {
        parsedHistory = history ? JSON.parse(history) : {};
      } catch (e) {
        console.error("Error parsing command history:", e);
      }

      parsedHistory[command.name] = (parsedHistory[command.name] || 0) + 1;
      safeLocalStorage.setItem(historyKey, JSON.stringify(parsedHistory));

      // Execute the command
      executeCommand(command);
    },
    [selectedProject, executeCommand]
  );

  // Command selection helper
  const selectCommand = useCallback(
    (command) => {
      if (!command) return;

      // Prepare the input with command name and any arguments that were already typed
      const textBeforeSlash = input.slice(0, slashPosition);
      const textAfterSlash = input.slice(slashPosition);
      const spaceIndex = textAfterSlash.indexOf(" ");
      const textAfterQuery = spaceIndex !== -1 ? textAfterSlash.slice(spaceIndex) : "";

      const newInput = textBeforeSlash + command.name + " " + textAfterQuery;

      // Update input temporarily so executeCommand can parse arguments
      setInput(newInput);

      // Hide command menu
      setShowCommandMenu(false);
      setSlashPosition(-1);
      setCommandQuery("");
      setSelectedCommandIndex(-1);

      // Clear debounce timer
      if (commandQueryTimerRef.current) {
        clearTimeout(commandQueryTimerRef.current);
      }

      // Execute the command (which will load its content and send to Agent)
      executeCommand(command);
    },
    [input, slashPosition, setInput, executeCommand]
  );

  // Keyboard navigation handler for command menu
  const handleCommandKeyDown = useCallback(
    (e) => {
      // Handle command menu navigation
      if (showCommandMenu && filteredCommands.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedCommandIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
          return true;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedCommandIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
          return true;
        }
        if (e.key === "Tab" || e.key === "Enter") {
          e.preventDefault();
          if (selectedCommandIndex >= 0) {
            selectCommand(filteredCommands[selectedCommandIndex]);
          } else if (filteredCommands.length > 0) {
            selectCommand(filteredCommands[0]);
          }
          return true;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setShowCommandMenu(false);
          setSlashPosition(-1);
          setCommandQuery("");
          setSelectedCommandIndex(-1);
          if (commandQueryTimerRef.current) {
            clearTimeout(commandQueryTimerRef.current);
          }
          return true;
        }
      }
      return false;
    },
    [showCommandMenu, filteredCommands, selectedCommandIndex, selectCommand]
  );

  // Detect slash command in input
  const detectSlashCommand = useCallback((newValue, cursorPos) => {
    // Early return if @ symbol is being processed
    if (newValue.includes("@")) {
      setShowCommandMenu(false);
      setSlashPosition(-1);
      setCommandQuery("");
      return;
    }

    // Detect slash command at cursor position
    // Look backwards from cursor to find a slash that starts a command
    const textBeforeCursor = newValue.slice(0, cursorPos);

    // Check if we're in a code block (simple heuristic: between triple backticks)
    const backticksBefore = (textBeforeCursor.match(/```/g) || []).length;
    const inCodeBlock = backticksBefore % 2 === 1;

    if (inCodeBlock) {
      // Don't show command menu in code blocks
      setShowCommandMenu(false);
      setSlashPosition(-1);
      setCommandQuery("");
      return;
    }

    // Find the last slash before cursor that could start a command
    // Slash is valid if it's at the start or preceded by whitespace
    const slashPattern = /(^|\s)\/(\S*)$/;
    const match = textBeforeCursor.match(slashPattern);

    if (match) {
      const slashPos = match.index + match[1].length; // Position of the slash
      const query = match[2]; // Text after the slash

      // Update states with debouncing for query
      setSlashPosition(slashPos);
      setShowCommandMenu(true);
      setSelectedCommandIndex(-1);

      // Debounce the command query update
      if (commandQueryTimerRef.current) {
        clearTimeout(commandQueryTimerRef.current);
      }

      commandQueryTimerRef.current = setTimeout(() => {
        setCommandQuery(query);
      }, 150); // 150ms debounce
    } else {
      // No slash command detected
      setShowCommandMenu(false);
      setSlashPosition(-1);
      setCommandQuery("");

      if (commandQueryTimerRef.current) {
        clearTimeout(commandQueryTimerRef.current);
      }
    }
  }, []);

  return {
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
    commandQueryTimerRef,
  };
};
