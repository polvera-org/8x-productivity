#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const TOKEN = process.env.SOLOHACKER_TOKEN;
const API_URL = (process.env.SOLOHACKER_API_URL || '').replace(/\/+$/, '');
const AGENT = process.env.SOLOHACKER_AGENT || '';

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------
async function api(method, apiPath, body) {
  if (!TOKEN) {
    process.stderr.write('Error: SOLOHACKER_TOKEN is not set.\nThe token is injected automatically inside the container PTY.\n');
    process.exit(1);
  }
  if (!API_URL) {
    process.stderr.write('Error: SOLOHACKER_API_URL is not set.\nSet it to the Solo Hacker platform API base URL.\n');
    process.exit(1);
  }

  const url = `${API_URL}${apiPath}`;
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };
  if (AGENT) headers['X-Agent'] = AGENT;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(url, opts);
  } catch (err) {
    process.stderr.write(`Error: Could not reach ${API_URL} — ${err.message}\n`);
    process.exit(1);
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) msg += `: ${data.error}`;
    } catch { /* ignore parse error */ }
    process.stderr.write(`Error: ${msg}\n`);
    process.exit(1);
  }

  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

// ---------------------------------------------------------------------------
// Agent format converters (mirrors scripts/build-cli-configs.sh)
// ---------------------------------------------------------------------------
const ORCHESTRATOR_DELEGATES = ['kepler', 'turing', 'euclid', 'ada', 'nebula', 'rosetta', 'comet'];

function toClaudeFormat(agent, allAgentNames) {
  const isOrchestrator = agent.role === 'orchestrator';
  const delegates = allAgentNames.filter(n => n !== agent.name);
  const tools = isOrchestrator
    ? `Read, Edit, Bash, Write, Glob, Grep, Agent(${delegates.join(', ')})`
    : 'Read, Edit, Bash, Write, Glob, Grep';

  return [
    '---',
    `name: ${agent.name}`,
    `description: ${agent.description}`,
    `tools: ${tools}`,
    'model: inherit',
    '---',
    '',
    agent.body,
    '',
  ].join('\n');
}

function toOpenCodeFormat(agent) {
  return [
    '---',
    `description: ${agent.description}`,
    'mode: agent',
    'tools:',
    '  read: true',
    '  edit: true',
    '  bash: true',
    '  write: true',
    '---',
    '',
    agent.body,
    '',
  ].join('\n');
}

function toCodexSection(agent) {
  return [
    `## ${agent.name}`,
    '',
    agent.description,
    '',
    agent.body,
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function syncAgents() {
  const agents = await api('GET', '/api/agents');

  const claudeDir = '/root/.claude/agents';
  const opencodeDir = '/root/.opencode/agents';
  const codexFile = '/root/.codex/AGENTS.md';

  // Clean and recreate directories
  fs.rmSync(claudeDir, { recursive: true, force: true });
  fs.rmSync(opencodeDir, { recursive: true, force: true });
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.mkdirSync(opencodeDir, { recursive: true });
  fs.mkdirSync(path.dirname(codexFile), { recursive: true });

  const allNames = agents.map(a => a.name);

  for (const agent of agents) {
    const filename = `${agent.name}.md`;
    fs.writeFileSync(path.join(claudeDir, filename), toClaudeFormat(agent, allNames));
    fs.writeFileSync(path.join(opencodeDir, filename), toOpenCodeFormat(agent));
  }

  // Build combined AGENTS.md for Codex
  const header = [
    '# Agent Roster',
    '',
    'Eight specialized agents that form a complete product engineering team.',
    '',
  ].join('\n');
  const sections = agents.map(a => toCodexSection(a)).join('\n');
  fs.writeFileSync(codexFile, header + sections);

  console.log(`Synced ${agents.length} agents to ${claudeDir}, ${opencodeDir}, and ${codexFile}`);
}

const STATUS_ORDER = { in_review: 0, in_progress: 1, todo: 2, backlog: 3, draft: 4 };

function padRight(str, len) {
  str = String(str);
  return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

function printIssueTable(issues) {
  if (!issues || issues.length === 0) {
    console.log('No issues found.');
    return;
  }

  // Calculate column widths
  const cols = { status: 6, id: 2, priority: 8, agent: 5, title: 5 };
  for (const issue of issues) {
    cols.status = Math.max(cols.status, (issue.status || '').length);
    cols.id = Math.max(cols.id, (issue.id || '').length);
    cols.priority = Math.max(cols.priority, (issue.priority || '').length);
    cols.agent = Math.max(cols.agent, (issue.agent || '\u2014').length);
    cols.title = Math.max(cols.title, (issue.title || '').length);
  }

  const header = `${padRight('STATUS', cols.status)}  ${padRight('ID', cols.id)}  ${padRight('PRIORITY', cols.priority)}  ${padRight('AGENT', cols.agent)}  TITLE`;
  console.log(header);

  for (const issue of issues) {
    const agent = issue.agent || '\u2014';
    const line = `${padRight(issue.status, cols.status)}  ${padRight(issue.id, cols.id)}  ${padRight(issue.priority, cols.priority)}  ${padRight(agent, cols.agent)}  ${issue.title}`;
    console.log(line);
  }
}

async function listIssues() {
  const issues = await api('GET', '/api/issues?exclude_status=completed');
  issues.sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));
  printIssueTable(issues);
}

async function listCompletedIssues() {
  const issues = await api('GET', '/api/issues?status=completed&limit=20');
  printIssueTable(issues);
}

async function readIssue(id) {
  if (!id) {
    process.stderr.write('Usage: solohacker read-issue <id>\n');
    process.exit(1);
  }

  const issue = await api('GET', `/api/issues/${encodeURIComponent(id)}`);

  console.log(`Issue ${issue.id}: ${issue.title}`);
  console.log(`Status: ${issue.status} | Priority: ${issue.priority} | Agent: ${issue.agent || '\u2014'}`);
  if (issue.labels && issue.labels.length > 0) {
    console.log(`Labels: ${issue.labels.join(', ')}`);
  }
  console.log(`Created: ${issue.created_at || '\u2014'} | Updated: ${issue.updated_at || '\u2014'}`);

  if (issue.description) {
    console.log('\nDescription:');
    for (const line of issue.description.split('\n')) {
      console.log(`  ${line}`);
    }
  }

  if (issue.comments && issue.comments.length > 0) {
    console.log(`\nComments (${issue.comments.length}):`);
    for (const c of issue.comments) {
      console.log(`  [${c.created_at}] ${c.author}: ${c.body}`);
    }
  }
}

async function createIssue(args) {
  const flags = parseFlags(args);

  if (!flags.title) {
    process.stderr.write('Usage: solohacker create-issue --title "..." [--description "..."] [--status draft|backlog|todo] [--priority low|medium|high|urgent] [--labels "a,b,c"]\n');
    process.exit(1);
  }

  const body = { title: flags.title };
  if (flags.description) body.description = flags.description;
  body.status = flags.status || 'draft';
  body.priority = flags.priority || 'medium';
  if (flags.labels) body.labels = flags.labels.split(',').map(l => l.trim());

  const issue = await api('POST', '/api/issues', body);
  console.log(`Created issue ${issue.id}: ${issue.title}`);
}

async function updateIssue(id, args) {
  if (!id) {
    process.stderr.write('Usage: solohacker update-issue <id> [--status ...] [--priority ...] [--title "..."] [--description "..."] [--labels "a,b,c"]\n');
    process.exit(1);
  }

  const flags = parseFlags(args);
  const body = {};
  if (flags.status) body.status = flags.status;
  if (flags.priority) body.priority = flags.priority;
  if (flags.title) body.title = flags.title;
  if (flags.description) body.description = flags.description;
  if (flags.labels) body.labels = flags.labels.split(',').map(l => l.trim());

  if (Object.keys(body).length === 0) {
    process.stderr.write('Error: No update flags provided.\n');
    process.exit(1);
  }

  const issue = await api('PATCH', `/api/issues/${encodeURIComponent(id)}`, body);
  console.log(`Updated issue ${issue.id}: ${issue.title}`);
}

async function assignIssue(id, agent) {
  if (!id || !agent) {
    process.stderr.write('Usage: solohacker assign-issue <id> <agent>\n');
    process.exit(1);
  }

  await api('POST', `/api/issues/${encodeURIComponent(id)}/assign`, { agent });
  console.log(`Assigned ${id} to ${agent}`);
}

async function commentIssue(id, text) {
  if (!id || !text) {
    process.stderr.write('Usage: solohacker comment-issue <id> "<text>"\n');
    process.exit(1);
  }

  await api('POST', `/api/issues/${encodeURIComponent(id)}/comments`, { body: text });
  console.log(`Comment added to ${id}`);
}

async function listGoals() {
  const goals = await api('GET', '/api/goals');

  if (!goals || goals.length === 0) {
    console.log('No goals found.');
    return;
  }

  for (let i = 0; i < goals.length; i++) {
    const g = goals[i];
    console.log(`${i + 1}. ${g.title}`);
    if (g.description) console.log(`   ${g.description}`);
    if (g.progress != null) console.log(`   Progress: ${g.progress}`);
    console.log('');
  }
}

// ---------------------------------------------------------------------------
// Flag parser
// ---------------------------------------------------------------------------
function parseFlags(args) {
  const flags = {};
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--') && i + 1 < args.length) {
      flags[arg.slice(2)] = args[i + 1];
      i += 2;
    } else {
      i++;
    }
  }
  return flags;
}

// ---------------------------------------------------------------------------
// CLI router
// ---------------------------------------------------------------------------
const HELP = `Solo Hacker CLI — manage issues, agents, and goals from the container shell.

Usage: solohacker <command> [args]

Commands:
  sync-agents                         Sync agent configs from platform to local CLI directories
  list-issues                         List open issues (excludes completed)
  list-completed-issues               List recently completed issues
  read-issue <id>                     Show full issue details with comments
  create-issue [flags]                Create a new issue
  update-issue <id> [flags]           Update an issue
  assign-issue <id> <agent>           Assign an issue to an agent (triggers execution)
  comment-issue <id> "<text>"         Add a comment to an issue
  list-goals                          List company goals with progress

Create/update flags:
  --title "..."                       Issue title (required for create)
  --description "..."                 Issue description
  --status <status>                   draft | backlog | todo | in_progress | in_review | completed
  --priority <priority>               low | medium | high | urgent
  --labels "a,b,c"                    Comma-separated labels

Environment:
  SOLOHACKER_TOKEN                    Auth token (auto-injected in container)
  SOLOHACKER_API_URL                  Platform API base URL
  SOLOHACKER_AGENT                    Agent name for attribution
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(HELP);
    process.exit(0);
  }

  switch (command) {
    case 'sync-agents':
      return syncAgents();
    case 'list-issues':
      return listIssues();
    case 'list-completed-issues':
      return listCompletedIssues();
    case 'read-issue':
      return readIssue(args[1]);
    case 'create-issue':
      return createIssue(args.slice(1));
    case 'update-issue':
      return updateIssue(args[1], args.slice(2));
    case 'assign-issue':
      return assignIssue(args[1], args[2]);
    case 'comment-issue':
      return commentIssue(args[1], args[2]);
    case 'list-goals':
      return listGoals();
    default:
      process.stderr.write(`Unknown command: ${command}\n\nRun 'solohacker --help' for usage.\n`);
      process.exit(1);
  }
}

main().catch(err => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
