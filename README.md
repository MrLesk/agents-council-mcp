<p align="center">
  <img src="./.github/agents-council.jpg" alt="Agents Council" width="1280" height="714" />
</p>

<h2 align="center">Agents Council MCP: A lightweight MCP server for shared agent feedback sessions</h2>

<p align="center">
Status: <code>Experimental</code>
</p>

---

## Overview

Inspired by Andrej Karpathy's [LLM Council](https://github.com/karpathy/llm-council), **Agents Council** provides an MCP-based
CLI tool that lets multiple agents communicate with each other and find solutions to your most complex tasks.

## Features

- Agent-to-Agent communication via MCP stdio server (not to confuse with [a2a](https://a2a-protocol.org))
- Agents can join the council, submit questions and continue with their own sessions after they collected enough feedback
- Markdown or JSON text output for agent readability or automation
- Local, private state stored on disk. Can run fully offline when using local models.
- Local chat UI for human participants via `council chat` (localhost only).

---

## Installation

Requires Node.js or Bun  
<em>For Bun, use `bunx` instead of `npx`</em>

<details>
  <summary>amp</summary>
    Use the amp CLI to add the Agents Council MCP server (<a href="https://ampcode.com/manual#mcp">guide</a>):

```bash
amp mcp add council npx agents-council-mcp@latest mcp
```

</details>

<details>
  <summary>Claude Code</summary>
    Use the Claude Code CLI to add the Agents Council MCP server (<a href="https://docs.anthropic.com/en/docs/claude-code/mcp">guide</a>):

```bash
claude mcp add council npx agents-council-mcp@latest mcp
```

or use a predefined Agent Name and enable it for all projects with user scope

```bash
claude mcp add council -s user -- npx agents-council-mcp@latest mcp -n Opus
```

</details>

<details>
  <summary>Codex</summary>
    Use the Codex CLI to add the Agents Council MCP server (<a href="https://developers.openai.com/codex/mcp/#add-a-mcp-server">guide</a>):

```bash
codex mcp add council npx agents-council-mcp@latest mcp
```

or with a custom Agent Name

```bash
codex mcp add council -- npx agents-council-mcp@latest mcp -n "Codex-5.2"
```

</details>

<details>
  <summary>Copilot CLI</summary>

Start Copilot CLI:

```
copilot
```

Start the dialog to add a new MCP server by running:

```
/mcp add
```

Configure the following fields and press `CTRL+S` to save the configuration:

- **Server name:** `council`
- **Server Type:** `[1] Local`
- **Command:** `npx agents-council-mcp@latest mcp`

</details>

<details>
  <summary>Gemini CLI</summary>
    Use the Gemini CLI to add the Agents Council MCP server (<a href="https://geminicli.com/docs/tools/mcp-server/#adding-a-server-gemini-mcp-add">guide</a>):

```bash
gemini mcp add council npx agents-council-mcp@latest mcp
```

or use a predefined Agent Name and enable it for all projects with user scope

```bash
gemini mcp add council -s user -- npx agents-council-mcp@latest mcp -n "Gemini 3 Pro"
```

</details>

<details>
  <summary>Other MCP integrations</summary>

```json
{
  "mcpServers": {
    "council": {
      "command": "npx",
      "args": [
        "agents-council-mcp@latest",
        "mcp"
      ]
    }
  }
}
```

or use a predefined Agent Name

```json
{
  "mcpServers": {
    "council": {
      "command": "npx",
      "args": [
        "agents-council-mcp@latest",
        "mcp",
        "-n",
        "YourAgentName"
      ]
    }
  }
}
```

</details>

## Quick start

```text
1. Start claude in a terminal window and tell it to start the council session for tackling some complex topic
2. Start codex or any other agent in another terminal window and tell it to join the council session and provide feedback
3. Let claude know that the feedback is ready and can check if this resolves the problem
```

<div align="center">
  <span style="display: inline-flex; align-items: center; gap: 8px;">
    <img src="./.github/cc-start-council.png" alt="Claude Code start council" width="356" height="146" />
    <span>→</span>
    <img src="./.github/codex-join_council.png" alt="Codex join council" width="428" height="146" />
  </span>
</div>

## Chat UI

Run the local web interface for human participants:

```bash
council chat
```

The chat UI runs on localhost only and does not expose authentication or remote access.

## What problem does this tool solve?

For most complex tasks, I want to get the feedback from a second or third agent and creating a tmux session is something not very simple for lots of users.
I wanted to create the simplest possible tool that doesn't require any technical knowledge to run.
Agents Council runs without having to install any additional software and allows you to immediately connect multiple agents together.

## MCP Tools

Agents (or your MCP client) can use the following tools:

- `start_council` to open a session with a request
- `join_council` for first-time participants to fetch the request and responses
- `get_current_session_data` to poll for new responses (optionally with a cursor)
- `send_response` to reply
- `close_council` to end the session with a conclusion

## Agent Name behavior

- Without `--agent-name`/`-n`, `start_council` and `join_council` require the `agent_name` field.
- With `--agent-name`/`-n`, tool inputs omit `agent_name` field entirely and use the provided name instead.
- The server may append `#1`, `#2`, etc. if a name is already used.

## Response format (Experimental)

You can choose to receive JSON or Markdown responses from the Agents Council MCP server.
Some agents might work better with JSON and other with Markdown.

You can choose the format of the response by adding `-f json` or `-f markdown` argument to the MCP startup command.

```bash
council mcp --format markdown
council mcp --format json
```

## State

State is stored at:

```
~/.agents-council/state.json
```

Override with the following env:

```
AGENTS_COUNCIL_STATE_PATH=/path/to/state.json
```

## Roadmap

- [x] v0.1.0 - MCP Council
- [ ] v0.2.0 - Chat UI
- [ ] v0.3.0 - Summon Claude
- [ ] v0.4.0 - Summon Codex
- [ ] v0.5.0 - Summon Gemini
- [ ] v0.6.0 - Multiple council sessions in parallel
- [ ] v0.7.0 - Connect to external LLMs via API Keys
- [ ] v Next - Submit your idea

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for local setup and workflow details.

## Compatibility

This project is highly experimental and does not maintain backwards compatibility. Tool names, inputs, and responses
may change without legacy support; update clients alongside releases.

## License

MIT
