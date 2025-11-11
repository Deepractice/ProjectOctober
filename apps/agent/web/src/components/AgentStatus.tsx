import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AgentStatusProps {
  status?: {
    text?: string;
    tokens?: number;
    can_interrupt?: boolean;
  };
  onAbort?: () => void;
  isLoading: boolean;
  provider?: "claude" | "cursor";
}

function AgentStatus({
  status,
  onAbort,
  isLoading,
  provider: _provider = "claude",
}: AgentStatusProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) return;

    const timer = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(timer);
  }, [isLoading]);

  const actionWords = ["Thinking", "Processing", "Analyzing", "Working", "Computing", "Reasoning"];
  const actionIndex = Math.floor(elapsedTime / 3) % actionWords.length;

  const statusText = status?.text || actionWords[actionIndex];
  const tokens = status?.tokens; // Only show tokens if provided by backend
  const canInterrupt = status?.can_interrupt !== false;

  const spinners = ["✻", "✹", "✸", "✶"];
  const currentSpinner = spinners[animationPhase];

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="w-full mb-6"
        >
          <div className="flex items-center justify-between max-w-4xl mx-auto bg-gray-900 dark:bg-gray-950 text-white rounded-lg shadow-lg px-4 py-3">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <motion.span
                  animate={{
                    rotate: [0, 90, 180, 270, 360],
                    scale: [1, 1.1, 1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="text-xl text-blue-400"
                >
                  {currentSpinner}
                </motion.span>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{statusText}...</span>
                    <span className="text-gray-400 text-sm">({elapsedTime}s)</span>
                    {tokens > 0 && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-300 text-sm hidden sm:inline">
                          ⚒ {tokens.toLocaleString()} tokens
                        </span>
                        <span className="text-gray-300 text-sm sm:hidden">
                          ⚒ {tokens.toLocaleString()}
                        </span>
                      </>
                    )}
                    <span className="text-gray-400 hidden sm:inline">·</span>
                    <span className="text-gray-300 text-sm hidden sm:inline">esc to interrupt</span>
                  </div>
                  <div className="text-xs text-gray-400 sm:hidden mt-1">esc to interrupt</div>
                </div>
              </div>
            </div>

            {canInterrupt && onAbort && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAbort}
                className="ml-3 text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="hidden sm:inline">Stop</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AgentStatus;
