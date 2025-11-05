interface UserMessageProps {
  content: string;
  timestamp: string;
  images?: Array<{ data: string; name: string }>;
  isGrouped: boolean;
}

export function UserMessage({ content, timestamp, images, isGrouped }: UserMessageProps) {
  return (
    <div className="flex items-end space-x-0 sm:space-x-3 w-full sm:w-auto sm:max-w-[85%] md:max-w-md lg:max-w-lg xl:max-w-xl">
      <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 shadow-sm flex-1 sm:flex-initial">
        <div className="text-sm whitespace-pre-wrap break-words">{content}</div>
        {images && images.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img.data}
                alt={img.name}
                className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(img.data, "_blank")}
              />
            ))}
          </div>
        )}
        <div className="text-xs text-blue-100 mt-1 text-right">
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
      {!isGrouped && (
        <div className="hidden sm:flex w-8 h-8 bg-blue-600 rounded-full items-center justify-center text-white text-sm flex-shrink-0">
          U
        </div>
      )}
    </div>
  );
}
