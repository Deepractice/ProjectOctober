<div align="center">
  <h1>Deepractice Agent - AI Agent Without CLI</h1>
  <h2>Powerful AI Agent with Visual Interface - No Terminal Required</h2>
  <p>
    <strong>Tired of command-line tools?</strong> Deepractice Agent brings you full AI Agent capabilities through a beautiful web interface.
  </p>

  <!-- Badges -->
  <p>
    <a href="https://github.com/Deepractice/Agent"><img src="https://img.shields.io/github/stars/Deepractice/Agent?style=social" alt="Stars"/></a>
    <img src="https://komarev.com/ghpvc/?username=Agent&label=views&color=0e75b6&style=flat&abbreviated=true" alt="Views"/>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/Agent?color=blue" alt="License"/></a>
  </p>

  <p>
    <a href="https://hub.docker.com/r/deepracticexs/agent"><img src="https://img.shields.io/badge/docker-latest-0db7ed?logo=docker&logoColor=white" alt="Docker"/></a>
    <a href="https://github.com/Deepractice/Agent/releases"><img src="https://img.shields.io/github/v/release/Deepractice/Agent?color=green&logo=github" alt="Latest Release"/></a>
  </p>

  <p>
    <a href="README.md"><strong>English</strong></a> |
    <a href="README.zh-CN.md">简体中文</a>
  </p>
</div>

---

## ✨ Get Started in 3 Steps

### **Step 1**: Run One Docker Command

```bash
docker run -d \
  --name agent \
  -p 5200:5200 \
  -e ANTHROPIC_API_KEY=sk-ant-xxxxx \
  -v $(pwd):/project \
  deepracticexs/agent:latest
```

### **Step 2**: Open Your Browser

```text
http://localhost:5200
```

### **Step 3**: Start Chatting

That's it! No configuration files, no complex setup, just chat.

---

## 💡 Why Deepractice Agent?

<div align="center">

| ❌ Traditional AI Agent Tools            | ✅ Deepractice Agent                        |
| ---------------------------------------- | ------------------------------------------- |
| Command-line only - steep learning curve | Visual interface - click and chat           |
| Complex setup - hours of configuration   | One command start - ready in 30 seconds     |
| Terminal-bound - poor user experience    | Session management - organize conversations |
| Hard to share or collaborate             | Browser-based - access anywhere             |

</div>

---

## 🚀 Quick Start

### Prerequisites

Before you start, make sure you have:

1. **Docker installed** - [Install Docker](https://docs.docker.com/get-docker/)
2. **Anthropic API Key** - [Get API Key](https://console.anthropic.com/)

### Installation

#### Option 1: Docker Run (Recommended for Quick Try)

<details open>
<summary><strong>🔧 Interactive Command Generator</strong> (Click to expand/collapse)</summary>

<div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">

Fill in the form below to generate your customized Docker run command:

<form id="dockerCommandForm" style="display: flex; flex-direction: column; gap: 12px; margin: 15px 0;">
  <div>
    <label for="apiKey" style="display: block; margin-bottom: 5px; font-weight: bold;">
      Anthropic API Key <span style="color: red;">*</span>
    </label>
    <input
      type="text"
      id="apiKey"
      placeholder="sk-ant-xxxxx"
      style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace;"
      required
    />
  </div>

  <div>
    <label for="containerName" style="display: block; margin-bottom: 5px; font-weight: bold;">
      Container Name
    </label>
    <input
      type="text"
      id="containerName"
      value="agent"
      style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace;"
    />
  </div>

  <div>
    <label for="port" style="display: block; margin-bottom: 5px; font-weight: bold;">
      Port
    </label>
    <input
      type="number"
      id="port"
      value="5200"
      style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace;"
    />
  </div>

  <div>
    <label for="projectPath" style="display: block; margin-bottom: 5px; font-weight: bold;">
      Project Path
    </label>
    <input
      type="text"
      id="projectPath"
      value="$(pwd)"
      placeholder="$(pwd) or /path/to/your/project"
      style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace;"
    />
  </div>

  <div>
    <label for="baseUrl" style="display: block; margin-bottom: 5px; font-weight: bold;">
      API Base URL (Optional)
    </label>
    <input
      type="text"
      id="baseUrl"
      placeholder="https://api.anthropic.com"
      style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace;"
    />
  </div>

<button
type="button"
onclick="generateDockerCommand()"
style="padding: 10px 20px; background-color: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px;"

>

    Generate Docker Command

  </button>
</form>

<div id="generatedCommand" style="display: none; margin-top: 15px;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
    <strong>Your Docker Command:</strong>
    <button
      onclick="copyDockerCommand()"
      style="padding: 6px 12px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
    >
      📋 Copy to Clipboard
    </button>
  </div>
  <pre id="commandOutput" style="background-color: #f6f8fa; padding: 15px; border-radius: 6px; overflow-x: auto; border: 1px solid #ddd;"><code></code></pre>
  <div id="copyFeedback" style="display: none; color: #28a745; margin-top: 8px; font-weight: bold;">
    ✓ Copied to clipboard!
  </div>
</div>

<script>
function generateDockerCommand() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const containerName = document.getElementById('containerName').value.trim() || 'agent';
  const port = document.getElementById('port').value.trim() || '5200';
  const projectPath = document.getElementById('projectPath').value.trim() || '$(pwd)';
  const baseUrl = document.getElementById('baseUrl').value.trim();

  if (!apiKey) {
    alert('Please enter your Anthropic API Key');
    return;
  }

  let command = `docker run -d \\\n  --name ${containerName} \\\n  -p ${port}:5200 \\\n  -e ANTHROPIC_API_KEY=${apiKey}`;

  if (baseUrl) {
    command += ` \\\n  -e ANTHROPIC_BASE_URL=${baseUrl}`;
  }

  command += ` \\\n  -v ${projectPath}:/project \\\n  deepracticexs/agent:latest`;

  document.getElementById('commandOutput').textContent = command;
  document.getElementById('generatedCommand').style.display = 'block';
  document.getElementById('copyFeedback').style.display = 'none';
}

function copyDockerCommand() {
  const commandText = document.getElementById('commandOutput').textContent;
  navigator.clipboard.writeText(commandText).then(() => {
    const feedback = document.getElementById('copyFeedback');
    feedback.style.display = 'block';
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 2000);
  }).catch(err => {
    alert('Failed to copy: ' + err);
  });
}
</script>

</div>
</details>

**Or use the default command:**

```bash
docker run -d \
  --name agent \
  -p 5200:5200 \
  -e ANTHROPIC_API_KEY=sk-ant-xxxxx \
  -v $(pwd):/project \
  deepracticexs/agent:latest
```

**Access**: Open <http://localhost:5200> in your browser

#### Option 2: Docker Compose (Recommended for Production)

1. Create a `.env` file:

```bash
cp docker/agent/.env.example .env
```

2. Edit `.env` with your API key:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
ANTHROPIC_BASE_URL=https://api.anthropic.com
PROJECT_PATH=.
```

3. Start the service:

```bash
cd docker/agent
docker-compose up -d
```

4. View logs (optional):

```bash
docker-compose logs -f
```

5. Stop the service:

```bash
docker-compose down
```

### Configuration

**Required Environment Variables:**

- `ANTHROPIC_API_KEY` - Your Anthropic API key

**Optional Environment Variables:**

- `ANTHROPIC_BASE_URL` - API endpoint (default: <https://api.anthropic.com>)
- `PROJECT_PATH` - Project directory to mount (default: current directory)

---

## ✨ Features

- 💬 **Visual Chat Interface** - No terminal, just type and chat
- 📂 **Session Management** - Organize and revisit your conversations
- 🔄 **Real-time Streaming** - See AI thinking and responding in real-time
- 🛠️ **Tool Integration** - AI can execute code, access files, and more
- 🔒 **Self-hosted** - Your data stays on your machine
- 🌍 **Browser-based** - Access from anywhere on your network
- 📦 **One Container** - Frontend + Backend + WebSocket all in one

---

## ❓ FAQ

**Q: Do I need to know Docker?**
A: No. Just install Docker Desktop and copy-paste one command. That's all.

**Q: Is my data secure?**
A: Yes. Everything runs locally on your machine. Your API key and conversations stay with you.

**Q: Can I use other AI models besides Claude?**
A: Currently supports Anthropic Claude. Support for more models (OpenAI, local LLMs) is coming soon.

**Q: What if I don't have an Anthropic API Key?**
A: You need to sign up at [Anthropic Console](https://console.anthropic.com/) and create an API key. It's free to start.

**Q: Can I access Deepractice Agent from other devices?**
A: Yes. Replace `localhost` with your machine's IP address (e.g., `http://192.168.1.100:5200`).

**Q: I got an error. Where can I get help?**
A: Check our [Troubleshooting Guide](./docker/agent/README.md) or [open an issue](https://github.com/Deepractice/Agent/issues).

---

## 🔧 For Developers

Want to customize, contribute, or build from source?

- **[Docker Documentation](./docker/agent/README.md)** - Build and deployment details
- **[Development Guide](./CONTRIBUTING.md)** - How to contribute
- **[Architecture Overview](./docs/ARCHITECTURE.md)** - System design and technical details

### Build from Source

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build for production
pnpm build
```

---

## 🏢 About

Built with ❤️ by [Deepractice](https://github.com/Deepractice)

**Part of Deepractice AI Ecosystem:**

- [PromptX](https://github.com/Deepractice/PromptX) - AI Agent Context Platform (Roles, Tools, Memory)
- **Deepractice Agent** - Visual AI Agent Interface (You are here)

Deepractice Agent provides the interface, PromptX provides the intelligence. Together, they make AI accessible to everyone.

---

## ⭐ Star History

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=Deepractice/Agent&type=Date)](https://star-history.com/#Deepractice/Agent&Date)

</div>

---

<div align="center">
  <p>
    <strong>Making AI Accessible to Everyone</strong>
  </p>
  <p>
    If you find Deepractice Agent useful, please consider giving us a ⭐ on GitHub!
  </p>
</div>
