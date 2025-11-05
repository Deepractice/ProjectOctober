import React from "react";
import { MicButton } from "~/components/MicButton.jsx";

interface ActionButtonsProps {
  onImageUpload: () => void;
  onToggleCommandMenu: () => void;
  showCommandMenu?: boolean;
  commandCount?: number;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading?: boolean;
  hasInput?: boolean;
  onTranscript: (text: string) => void;
}

function ActionButtons({
  onImageUpload,
  onToggleCommandMenu,
  showCommandMenu = false,
  commandCount = 0,
  onSubmit,
  isLoading = false,
  hasInput = false,
  onTranscript,
}: ActionButtonsProps) {
  return (
    <>
      {/* Image upload button */}
      <button
        type="button"
        onClick={onImageUpload}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Attach images"
      >
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Mic button - HIDDEN */}
      <div
        className="absolute right-16 sm:right-16 top-1/2 transform -translate-y-1/2"
        style={{ display: "none" }}
      >
        <MicButton onTranscript={onTranscript} className="w-10 h-10 sm:w-10 sm:h-10" />
      </div>

      {/* Slash commands button */}
      <button
        type="button"
        onClick={onToggleCommandMenu}
        className="absolute right-14 sm:right-36 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-10 sm:h-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-gray-800 relative z-10"
        title="Show all commands"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
        {/* Command count badge */}
        {commandCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            style={{ fontSize: "10px" }}
          >
            {commandCount}
          </span>
        )}
      </button>

      {/* Send button */}
      <button
        type="submit"
        disabled={!hasInput || isLoading}
        onMouseDown={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-12 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-gray-800"
      >
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 text-white transform rotate-90"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </>
  );
}

export default ActionButtons;
