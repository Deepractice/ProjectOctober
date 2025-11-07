import type { ContentBlock } from "~/types/chat";

interface UserMessageProps {
  content: string | ContentBlock[];
  timestamp: string;
  images?: Array<{ data: string; name: string }>;
  isGrouped: boolean;
}

export function UserMessage({ content, timestamp, images, isGrouped }: UserMessageProps) {
  // Extract text and images from ContentBlock[]
  let textContent = "";
  let contentImages: Array<{ data: string; type: string }> = [];

  if (typeof content === "string") {
    textContent = content;
  } else if (Array.isArray(content)) {
    console.log("[UserMessage] Processing ContentBlock[]:", {
      blockCount: content.length,
      blockTypes: content.map((b) => b.type),
    });

    // Extract text blocks
    const textBlocks = content.filter((block) => block.type === "text");
    textContent = textBlocks.map((block) => block.text).join("\n");

    // Extract image blocks
    const imageBlocks = content.filter((block) => block.type === "image");
    console.log("[UserMessage] Found image blocks:", imageBlocks.length);

    contentImages = imageBlocks.map((block, idx) => {
      const dataUrl = `data:${block.source.media_type};base64,${block.source.data}`;
      console.log("[UserMessage] Image block", idx, {
        mediaType: block.source.media_type,
        dataLength: block.source.data.length,
        dataUrlPreview: dataUrl.substring(0, 100),
      });
      return {
        data: dataUrl,
        type: block.source.media_type,
      };
    });
  }

  // Merge images from both sources (deprecated images prop + ContentBlock images)
  const allImages = [...contentImages, ...(images || [])];

  console.log("[UserMessage] Rendering:", {
    textContent: textContent.substring(0, 50),
    imageCount: allImages.length,
  });

  return (
    <div className="flex flex-col items-end w-full sm:w-auto sm:max-w-[85%] md:max-w-md lg:max-w-lg xl:max-w-xl">
      <div className="flex items-end space-x-2">
        <div className="bg-orange-500 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 shadow-sm">
          {textContent && (
            <div className="text-sm whitespace-pre-wrap break-words">{textContent}</div>
          )}
          {allImages.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {allImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img.data}
                  alt={`Image ${idx + 1}`}
                  className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(img.data, "_blank")}
                />
              ))}
            </div>
          )}
        </div>
        {!isGrouped && (
          <div className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-2xl flex-shrink-0">
            👤
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 mr-10">
        {new Date(timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
