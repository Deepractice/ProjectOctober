import type { Meta, StoryObj } from "@storybook/react";
import { AppHeader } from "./AppHeader";
import { MessageSquare, Bot, Settings, Menu, Bell, User, Search } from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";

const meta: Meta<typeof AppHeader> = {
  title: "UI/AppHeader",
  component: AppHeader,
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Application title",
    },
    subtitle: {
      control: "text",
      description: "Subtitle or description",
    },
    showBorder: {
      control: "boolean",
      description: "Show border at bottom",
    },
    isMobile: {
      control: "boolean",
      description: "Mobile mode (compact layout)",
    },
    isPWA: {
      control: "boolean",
      description: "PWA mode (adds safe area padding)",
    },
    logo: {
      control: false,
      description: "Logo element (icon or image)",
    },
    actions: {
      control: false,
      description: "Additional actions on the right side",
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppHeader>;

export const Default: Story = {
  args: {
    logo: <MessageSquare className="w-4 h-4" />,
    title: "Deepractice Agent",
  },
};

export const WithSubtitle: Story = {
  args: {
    logo: <Bot className="w-4 h-4" />,
    title: "AI Assistant",
    subtitle: "Powered by Claude",
  },
};

export const DeepracticeAgent: Story = {
  args: {
    logo: <MessageSquare className="w-4 h-4" />,
    title: "Deepractice Agent",
  },
  parameters: {
    docs: {
      description: {
        story: "SidebarHeader design for Deepractice Agent",
      },
    },
  },
};

export const WithActions: Story = {
  args: {
    logo: <MessageSquare className="w-4 h-4" />,
    title: "My Application",
    actions: (
      <>
        <Button variant="ghost" size="sm">
          <Bell className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Header with action buttons on the right",
      },
    },
  },
};

export const WithNotificationBadge: Story = {
  args: {
    logo: <Bot className="w-4 h-4" />,
    title: "Agent Dashboard",
    actions: (
      <>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
          >
            3
          </Badge>
        </Button>
        <Button variant="ghost" size="sm">
          <User className="w-4 h-4" />
        </Button>
      </>
    ),
  },
};

export const WithMenuButton: Story = {
  args: {
    logo: <MessageSquare className="w-4 h-4" />,
    title: "Agent",
    actions: (
      <Button variant="ghost" size="sm">
        <Menu className="w-4 h-4" />
      </Button>
    ),
  },
};

export const WithSearchAction: Story = {
  args: {
    logo: <Bot className="w-4 h-4" />,
    title: "Knowledge Base",
    subtitle: "1,234 documents",
    actions: (
      <Button variant="outline" size="sm">
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
    ),
  },
};

export const WithoutLogo: Story = {
  args: {
    title: "Simple Header",
  },
  parameters: {
    docs: {
      description: {
        story: "Header without logo icon",
      },
    },
  },
};

export const WithoutBorder: Story = {
  args: {
    logo: <MessageSquare className="w-4 h-4" />,
    title: "Borderless Header",
    showBorder: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Header without bottom border",
      },
    },
  },
};

export const MobileMode: Story = {
  args: {
    logo: <MessageSquare className="w-4 h-4" />,
    title: "Deepractice Agent",
    isMobile: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Mobile layout (compact, hidden on desktop)",
      },
    },
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const PWAMode: Story = {
  args: {
    logo: <MessageSquare className="w-4 h-4" />,
    title: "Agent",
    isMobile: true,
    isPWA: true,
  },
  parameters: {
    docs: {
      description: {
        story: "PWA mode with safe area padding at top",
      },
    },
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const DesktopVsMobile: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium mb-4">Desktop (default)</p>
        <AppHeader logo={<MessageSquare className="w-4 h-4" />} title="Deepractice Agent" />
      </div>
      <div>
        <p className="text-sm font-medium mb-4">Mobile</p>
        <AppHeader
          logo={<MessageSquare className="w-4 h-4" />}
          title="Deepractice Agent"
          isMobile
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Desktop vs Mobile layout comparison",
      },
    },
  },
};

export const CustomLogoSize: Story = {
  args: {
    logo: <MessageSquare className="w-5 h-5" />,
    title: "Custom Logo",
  },
  parameters: {
    docs: {
      description: {
        story: "You can customize the logo icon size",
      },
    },
  },
};

export const WithImageLogo: Story = {
  args: {
    logo: (
      <img
        src="https://api.dicebear.com/7.x/shapes/svg?seed=agent"
        alt="Logo"
        className="w-full h-full rounded-lg object-cover"
      />
    ),
    title: "My App",
    subtitle: "Version 1.0",
  },
  parameters: {
    docs: {
      description: {
        story: "Using an image as logo instead of icon",
      },
    },
  },
};

export const LongTitle: Story = {
  args: {
    logo: <Bot className="w-4 h-4" />,
    title: "Very Long Application Name That Might Need Truncation",
    subtitle: "With a subtitle too",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium mb-2">Basic</p>
        <AppHeader logo={<MessageSquare className="w-4 h-4" />} title="Basic Header" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">With Subtitle</p>
        <AppHeader
          logo={<Bot className="w-4 h-4" />}
          title="App with Subtitle"
          subtitle="Additional context"
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">With Actions</p>
        <AppHeader
          logo={<MessageSquare className="w-4 h-4" />}
          title="With Actions"
          actions={
            <>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </>
          }
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Without Border</p>
        <AppHeader logo={<Bot className="w-4 h-4" />} title="Borderless" showBorder={false} />
      </div>
    </div>
  ),
};

export const SidebarHeaderExample: Story = {
  render: () => (
    <div className="border rounded-lg overflow-hidden max-w-xs">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <AppHeader logo={<MessageSquare className="w-4 h-4" />} title="Deepractice Agent" />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <AppHeader
          logo={<MessageSquare className="w-4 h-4" />}
          title="Deepractice Agent"
          isMobile
        />
      </div>

      {/* Placeholder content */}
      <div className="p-4 space-y-2">
        <div className="h-8 bg-muted rounded" />
        <div className="h-8 bg-muted rounded" />
        <div className="h-8 bg-muted rounded" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example matching SidebarHeader component design with responsive layout",
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-slate-900 p-6 rounded-lg">
      <div className="space-y-8">
        <AppHeader logo={<MessageSquare className="w-4 h-4" />} title="Dark Mode Header" />
        <AppHeader
          logo={<Bot className="w-4 h-4" />}
          title="With Subtitle"
          subtitle="Looks great in dark mode"
        />
        <AppHeader
          logo={<MessageSquare className="w-4 h-4" />}
          title="With Actions"
          actions={
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          }
        />
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: "dark" },
  },
};

export const CustomStyling: Story = {
  args: {
    logo: <MessageSquare className="w-4 h-4" />,
    title: "Custom Styled",
    className: "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b-2 border-blue-500",
  },
  parameters: {
    docs: {
      description: {
        story: "Custom styling with gradient background and colored border",
      },
    },
  },
};
