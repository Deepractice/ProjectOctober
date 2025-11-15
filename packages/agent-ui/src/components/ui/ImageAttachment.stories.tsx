import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { ImageAttachment } from "./ImageAttachment";

// Mock file for demo purposes
const createMockFile = (name: string = "sample-image.jpg"): File => {
  return new File([""], name, { type: "image/jpeg" });
};

const meta: Meta<typeof ImageAttachment> = {
  title: "UI/ImageAttachment",
  component: ImageAttachment,
  tags: ["autodocs"],
  argTypes: {
    uploadProgress: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "Upload progress percentage (0-100)",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Image attachment preview component for input area. Shows upload progress, error states, and remove functionality. Single responsibility: display one image attachment with its state.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageAttachment>;

export const Default: Story = {
  args: {
    file: createMockFile(),
    onRemove: () => console.log("Remove clicked"),
  },
};

export const Uploading: Story = {
  args: {
    file: createMockFile(),
    uploadProgress: 45,
    onRemove: () => console.log("Remove clicked"),
  },
};

export const UploadComplete: Story = {
  args: {
    file: createMockFile(),
    uploadProgress: 100,
    onRemove: () => console.log("Remove clicked"),
  },
};

export const WithError: Story = {
  args: {
    file: createMockFile(),
    error: "Upload failed. File too large.",
    onRemove: () => console.log("Remove clicked"),
  },
};

export const UploadStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-3 text-slate-600">Ready to Upload</p>
        <div className="flex gap-3">
          <ImageAttachment
            file={createMockFile("photo-1.jpg")}
            onRemove={() => console.log("Remove 1")}
          />
          <ImageAttachment
            file={createMockFile("photo-2.jpg")}
            onRemove={() => console.log("Remove 2")}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3 text-slate-600">Uploading Progress</p>
        <div className="flex gap-3">
          <ImageAttachment
            file={createMockFile("photo-3.jpg")}
            uploadProgress={15}
            onRemove={() => console.log("Remove 3")}
          />
          <ImageAttachment
            file={createMockFile("photo-4.jpg")}
            uploadProgress={55}
            onRemove={() => console.log("Remove 4")}
          />
          <ImageAttachment
            file={createMockFile("photo-5.jpg")}
            uploadProgress={90}
            onRemove={() => console.log("Remove 5")}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3 text-slate-600">Error State</p>
        <div className="flex gap-3">
          <ImageAttachment
            file={createMockFile("photo-6.jpg")}
            error="File too large"
            onRemove={() => console.log("Remove 6")}
          />
          <ImageAttachment
            file={createMockFile("photo-7.jpg")}
            error="Invalid format"
            onRemove={() => console.log("Remove 7")}
          />
        </div>
      </div>
    </div>
  ),
};

export const MultipleAttachments: Story = {
  render: () => (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <p className="text-sm font-medium mb-3">Image Attachments Preview</p>
      <div className="flex flex-wrap gap-2">
        <ImageAttachment
          file={createMockFile("image-1.jpg")}
          onRemove={() => console.log("Remove 1")}
        />
        <ImageAttachment
          file={createMockFile("image-2.jpg")}
          uploadProgress={30}
          onRemove={() => console.log("Remove 2")}
        />
        <ImageAttachment
          file={createMockFile("image-3.jpg")}
          onRemove={() => console.log("Remove 3")}
        />
        <ImageAttachment
          file={createMockFile("image-4.jpg")}
          uploadProgress={75}
          onRemove={() => console.log("Remove 4")}
        />
        <ImageAttachment
          file={createMockFile("image-5.jpg")}
          error="Upload failed"
          onRemove={() => console.log("Remove 5")}
        />
      </div>
    </div>
  ),
};

export const InteractiveDemo: Story = {
  render: () => {
    const [images, setImages] = React.useState<
      Array<{ file: File; progress?: number; error?: string }>
    >([
      { file: createMockFile("demo-1.jpg") },
      { file: createMockFile("demo-2.jpg"), progress: 45 },
      { file: createMockFile("demo-3.jpg"), error: "Upload failed" },
    ]);

    const handleRemove = (index: number) => {
      setImages((prev) => prev.filter((_, i) => i !== index));
    };

    return (
      <div className="space-y-4">
        <div className="text-sm text-slate-600">
          Hover over images to see remove button. Click to remove.
        </div>
        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg min-h-32">
          {images.length > 0 ? (
            images.map((img, index) => (
              <ImageAttachment
                key={index}
                file={img.file}
                uploadProgress={img.progress}
                error={img.error}
                onRemove={() => handleRemove(index)}
              />
            ))
          ) : (
            <div className="w-full flex items-center justify-center text-slate-400">
              All images removed
            </div>
          )}
        </div>
      </div>
    );
  },
};
