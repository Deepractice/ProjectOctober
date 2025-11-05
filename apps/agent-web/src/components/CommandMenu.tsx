import React, { useEffect, useRef } from "react";

interface Command {
  name: string;
  description?: string;
  namespace?: string;
  type?: string;
  metadata?: {
    type?: string;
  };
}

interface CommandMenuProps {
  commands?: Command[];
  selectedIndex?: number;
  onSelect?: (command: Command, index: number, hover: boolean) => void;
  onClose: () => void;
  position?: { top: number; left: number; bottom?: number };
  isOpen?: boolean;
  frequentCommands?: Command[];
}

const CommandMenu = ({
  commands = [],
  selectedIndex = -1,
  onSelect,
  onClose,
  position = { top: 0, left: 0, bottom: undefined },
  isOpen = false,
  frequentCommands = [],
}: CommandMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  const getMenuPosition = () => {
    const isMobile = window.innerWidth < 640;
    const viewportHeight = window.innerHeight;
    const menuHeight = 300;

    if (isMobile) {
      const inputBottom = position.bottom || 90;

      return {
        position: "fixed" as const,
        bottom: `${inputBottom}px`,
        left: "16px",
        right: "16px",
        width: "auto",
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "min(50vh, 300px)",
      };
    }

    return {
      position: "fixed" as const,
      top: `${Math.max(16, Math.min(position.top, viewportHeight - 316))}px`,
      left: `${position.left}px`,
      width: "min(400px, calc(100vw - 32px))",
      maxWidth: "calc(100vw - 32px)",
      maxHeight: "300px",
    };
  };

  const menuPosition = getMenuPosition();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (selectedItemRef.current && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const itemRect = selectedItemRef.current.getBoundingClientRect();

      if (itemRect.bottom > menuRect.bottom) {
        selectedItemRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else if (itemRect.top < menuRect.top) {
        selectedItemRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) {
    return null;
  }

  if (commands.length === 0) {
    return (
      <div
        ref={menuRef}
        className="command-menu command-menu-empty bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        style={{
          ...menuPosition,
          maxHeight: "300px",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          zIndex: 1000,
          padding: "20px",
          opacity: 1,
          transform: "translateY(0)",
          transition: "opacity 150ms ease-in-out, transform 150ms ease-in-out",
          textAlign: "center",
        }}
      >
        No commands available
      </div>
    );
  }

  const hasFrequentCommands = frequentCommands.length > 0;

  const groupedCommands = commands.reduce(
    (groups, command) => {
      const namespace = command.namespace || command.type || "other";
      if (!groups[namespace]) {
        groups[namespace] = [];
      }
      groups[namespace].push(command);
      return groups;
    },
    {} as Record<string, Command[]>
  );

  if (hasFrequentCommands) {
    groupedCommands["frequent"] = frequentCommands;
  }

  const namespaceOrder = hasFrequentCommands
    ? ["frequent", "builtin", "project", "user", "other"]
    : ["builtin", "project", "user", "other"];
  const orderedNamespaces = namespaceOrder.filter((ns) => groupedCommands[ns]);

  const namespaceLabels: Record<string, string> = {
    frequent: "⭐ Frequently Used",
    builtin: "Built-in Commands",
    project: "Project Commands",
    user: "User Commands",
    other: "Other Commands",
  };

  let globalIndex = 0;
  const commandsWithIndex: (Command & { globalIndex: number; namespace: string })[] = [];
  orderedNamespaces.forEach((namespace) => {
    groupedCommands[namespace].forEach((command) => {
      commandsWithIndex.push({
        ...command,
        globalIndex: globalIndex++,
        namespace,
      });
    });
  });

  return (
    <div
      ref={menuRef}
      role="listbox"
      aria-label="Available commands"
      className="command-menu bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      style={{
        ...menuPosition,
        maxHeight: "300px",
        overflowY: "auto",
        borderRadius: "8px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        zIndex: 1000,
        padding: "8px",
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? "translateY(0)" : "translateY(-10px)",
        transition: "opacity 150ms ease-in-out, transform 150ms ease-in-out",
      }}
    >
      {orderedNamespaces.map((namespace) => (
        <div key={namespace} className="command-group">
          {orderedNamespaces.length > 1 && (
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                color: "#6b7280",
                padding: "8px 12px 4px",
                letterSpacing: "0.05em",
              }}
            >
              {namespaceLabels[namespace] || namespace}
            </div>
          )}
          {groupedCommands[namespace].map((command) => {
            const cmdWithIndex = commandsWithIndex.find(
              (c) => c.name === command.name && c.namespace === namespace
            );
            const isSelected = cmdWithIndex && cmdWithIndex.globalIndex === selectedIndex;

            return (
              <div
                key={`${namespace}-${command.name}`}
                ref={isSelected ? selectedItemRef : null}
                role="option"
                aria-selected={isSelected}
                className="command-item"
                onMouseEnter={() => onSelect && cmdWithIndex && onSelect(command, cmdWithIndex.globalIndex, true)}
                onClick={() => onSelect && cmdWithIndex && onSelect(command, cmdWithIndex.globalIndex, false)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor: isSelected ? "#eff6ff" : "transparent",
                  transition: "background-color 100ms ease-in-out",
                  marginBottom: "2px",
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: command.description ? "4px" : 0,
                    }}
                  >
                    <span style={{ fontSize: "16px", flexShrink: 0 }}>
                      {namespace === "builtin" && "⚡"}
                      {namespace === "project" && "📁"}
                      {namespace === "user" && "👤"}
                      {namespace === "other" && "📝"}
                    </span>

                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "#111827",
                        fontFamily: "monospace",
                      }}
                    >
                      {command.name}
                    </span>

                    {command.metadata?.type && (
                      <span
                        className="command-metadata-badge"
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: "#f3f4f6",
                          color: "#6b7280",
                          fontWeight: 500,
                        }}
                      >
                        {command.metadata.type}
                      </span>
                    )}
                  </div>

                  {command.description && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        marginLeft: "24px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {command.description}
                    </div>
                  )}
                </div>

                {isSelected && (
                  <span
                    style={{
                      marginLeft: "8px",
                      color: "#3b82f6",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    ↵
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default CommandMenu;
