import AgentLogo from "~/components/AgentLogo.jsx";

interface MessageHeaderProps {
  messageType: "assistant" | "user" | "error" | "tool";
}

export function MessageHeader({ messageType }: MessageHeaderProps) {
  return (
    <div className="flex items-center space-x-3 mb-2">
      {messageType === "error" ? (
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
          !
        </div>
      ) : messageType === "tool" ? (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
          🔧
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
          🤖
        </div>
      )}
      <div className="text-sm font-medium text-gray-900 dark:text-white">
        {messageType === "error" ? "Error" : messageType === "tool" ? "Tool" : "Agent"}
      </div>
    </div>
  );
}
