import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SearchInput } from "./SearchInput";
import { Filter, User, Mail } from "lucide-react";

const meta: Meta<typeof SearchInput> = {
  title: "UI/SearchInput",
  component: SearchInput,
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "text",
      description: "Current search value (controlled)",
    },
    onChange: {
      action: "onChange",
      description: "Callback when value changes",
    },
    onClear: {
      action: "onClear",
      description: "Callback when clear button is clicked",
    },
    showSearchIcon: {
      control: "boolean",
      description: "Show search icon on the left",
    },
    showClearButton: {
      control: "boolean",
      description: "Show clear button when input has value",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

// Wrapper component for controlled state
const SearchInputWrapper = (props: Partial<SearchInputProps>) => {
  const [value, setValue] = useState(props.value || "");
  return <SearchInput value={value} onChange={setValue} {...props} />;
};

export const Default: Story = {
  render: () => <SearchInputWrapper placeholder="Search..." />,
};

export const WithValue: Story = {
  render: () => <SearchInputWrapper value="example search" placeholder="Search..." />,
  parameters: {
    docs: {
      description: {
        story: "Input with initial value showing the clear button",
      },
    },
  },
};

export const SearchSessions: Story = {
  render: () => <SearchInputWrapper placeholder="Search sessions..." />,
  parameters: {
    docs: {
      description: {
        story: "Common use case for searching sessions",
      },
    },
  },
};

export const SearchMessages: Story = {
  render: () => <SearchInputWrapper placeholder="Search messages..." />,
};

export const SearchUsers: Story = {
  render: () => <SearchInputWrapper placeholder="Search users..." />,
};

export const WithoutSearchIcon: Story = {
  render: () => <SearchInputWrapper placeholder="Type to search..." showSearchIcon={false} />,
  parameters: {
    docs: {
      description: {
        story: "Input without the search icon on the left",
      },
    },
  },
};

export const WithoutClearButton: Story = {
  render: () => (
    <SearchInputWrapper value="cannot clear this" placeholder="Search..." showClearButton={false} />
  ),
  parameters: {
    docs: {
      description: {
        story: "Input without the clear button (even with value)",
      },
    },
  },
};

export const CustomSearchIcon: Story = {
  render: () => (
    <SearchInputWrapper
      placeholder="Filter results..."
      searchIcon={<Filter className="w-4 h-4" />}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Custom icon using Filter instead of Search",
      },
    },
  },
};

export const CustomPlaceholder: Story = {
  render: () => <SearchInputWrapper placeholder="What are you looking for?" />,
};

export const Disabled: Story = {
  render: () => <SearchInputWrapper value="disabled search" placeholder="Search..." disabled />,
};

export const CustomStyling: Story = {
  render: () => (
    <SearchInputWrapper
      placeholder="Custom styled search..."
      className="bg-muted/50 border-0 focus:bg-background focus:ring-1 focus:ring-primary/20"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Custom styling matching SessionSearchBar design",
      },
    },
  },
};

export const WithCustomClearHandler: Story = {
  render: () => {
    const [value, setValue] = useState("example");
    const [clearCount, setClearCount] = useState(0);

    return (
      <div className="space-y-2">
        <SearchInput
          value={value}
          onChange={setValue}
          onClear={() => {
            setValue("");
            setClearCount((c) => c + 1);
          }}
          placeholder="Search..."
        />
        <p className="text-xs text-muted-foreground">Clear button clicked: {clearCount} times</p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Custom onClear handler for additional logic (e.g., analytics)",
      },
    },
  },
};

export const SessionSearchBarExample: Story = {
  render: () => {
    const [value, setValue] = useState("");

    return (
      <div className="border rounded-lg p-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Sessions</h3>
          <SearchInput
            value={value}
            onChange={setValue}
            placeholder="Search sessions..."
            className="bg-muted/50 border-0 focus:bg-background focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Example matching the SessionSearchBar component design",
      },
    },
  },
};

export const MultipleSearchInputs: Story = {
  render: () => {
    const [sessions, setSessions] = useState("");
    const [users, setUsers] = useState("");
    const [messages, setMessages] = useState("");

    return (
      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-sm font-medium mb-2 block">Sessions</label>
          <SearchInput value={sessions} onChange={setSessions} placeholder="Search sessions..." />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Users</label>
          <SearchInput
            value={users}
            onChange={setUsers}
            placeholder="Search users..."
            searchIcon={<User className="w-4 h-4" />}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Messages</label>
          <SearchInput
            value={messages}
            onChange={setMessages}
            placeholder="Search messages..."
            searchIcon={<Mail className="w-4 h-4" />}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Multiple search inputs with different icons and purposes",
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Default (h-9)</label>
        <SearchInputWrapper placeholder="Search..." />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Small (h-8)</label>
        <SearchInputWrapper placeholder="Search..." className="h-8 text-xs" />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Large (h-10)</label>
        <SearchInputWrapper placeholder="Search..." className="h-10" />
      </div>
    </div>
  ),
};

export const DarkModeExample: Story = {
  render: () => (
    <div className="dark bg-slate-900 p-6 rounded-lg">
      <div className="space-y-4">
        <SearchInputWrapper placeholder="Search in dark mode..." />
        <SearchInputWrapper value="with value" placeholder="Search in dark mode..." />
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: {
        story: "SearchInput in dark mode",
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const mockResults = [
      "Project Planning Session",
      "Code Review Meeting",
      "Design Discussion",
      "Bug Triage",
      "Sprint Planning",
    ];
    const filteredResults = mockResults.filter((item) =>
      item.toLowerCase().includes(value.toLowerCase())
    );

    return (
      <div className="max-w-md">
        <SearchInput
          value={value}
          onChange={setValue}
          placeholder="Search sessions..."
          className="bg-muted/50 border-0 focus:bg-background focus:ring-1 focus:ring-primary/20"
        />
        <div className="mt-4 space-y-2">
          {value && filteredResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
          )}
          {filteredResults.map((item, index) => (
            <div
              key={index}
              className="p-2 rounded border bg-card hover:bg-accent transition-colors"
            >
              <p className="text-sm">{item}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo with live filtering results",
      },
    },
  },
};
