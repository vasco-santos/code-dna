#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  initRepo,
  startSession,
  recordDecision,
  reviewPR,
  writeSessionDoc,
  cleanupSession,
  initContext,
  checkDNAStatus,
  resumeSession,
} from './actions';
import fs from 'fs';
import path from 'path';

const STANDARDS_ROOT = path.resolve(__dirname, '..');
const CORE_DIR = path.join(STANDARDS_ROOT, 'core');

const server = new Server(
  {
    name: 'code-dna',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
);

/**
 * Resources: Expose our Markdown Engineering DNA as readable resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const files = fs.readdirSync(CORE_DIR);
  return {
    resources: files.map((file) => ({
      uri: `dna://${file.replace('.md', '')}`,
      name: `Engineering DNA: ${file}`,
      mimeType: 'text/markdown',
      description: `Global playbook for ${file}`,
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const name = request.params.uri.replace('dna://', '');
  const filePath = path.join(CORE_DIR, `${name}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`DNA resource ${name} not found`);
  }

  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: 'text/markdown',
        text: fs.readFileSync(filePath, 'utf8'),
      },
    ],
  };
});

/**
 * Tools: Expose our actions
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'init_repo',
        description: 'Initialize a repository with Global Engineering DNA (symlinks)',
        inputSchema: {
          type: 'object',
          properties: {
            mainRepoPath: {
              type: 'string',
              description: 'Optional: Path to the main repository to link DNA to',
            },
          },
        },
      },
      {
        name: 'check_status',
        description: 'Check if the repository is initialized with DNA and if standards are up to date.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'init_context',
        description: 'Initialize or sync repository-specific context files (architecture, idioms, devops)',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'start_session',
        description: 'Start a new DNA session with ADR and PR tracking. Supports multi-repo symlinking.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Short descriptive name for the session' },
            mainRepoPath: {
              type: 'string',
              description:
                'Optional: Path to the main repository if this is a linked session (will symlink).',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'resume_session',
        description: 'Resume a DNA session and get back all context for handoff.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'The ID of the session to resume' },
          },
        },
      },
      {
        name: 'write_session_doc',
        description: 'Write a document to the session folder with automatic versioning (v1, v2, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'The ID of the active session' },
            filename: { type: 'string', description: "The base filename (e.g., 'rfc.md' or 'plan')" },
            content: { type: 'string', description: 'The markdown content to write' },
          },
          required: ['sessionId', 'filename', 'content'],
        },
      },
      {
        name: 'cleanup_session',
        description: 'Cleanup old versions of session documents, keeping only the most recent ones.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'The ID of the active session' },
            keepLast: {
              type: 'number',
              description: 'Number of recent versions to keep (default: 3)',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'record_decision',
        description: 'Record an architectural decision in an active session log',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'The ID of the active session' },
            decision: { type: 'string', description: 'The rationale/decision to record' },
          },
          required: ['sessionId', 'decision'],
        },
      },
      {
        name: 'review_pr',
        description:
          'Fetch PR details, diff, and feedback for architectural review (inbound or outbound)',
        inputSchema: {
          type: 'object',
          properties: {
            prLink: { type: 'string', description: 'The URL or ID of the PR to review' },
            mode: {
              type: 'string',
              enum: ['inbound', 'outbound'],
              description: "Review mode: 'inbound' (analyzing feedback/fixing) or 'outbound' (first-pass audit)",
            },
          },
          required: ['prLink'],
        },
      },
    ],
  };
});

interface StartSessionArgs {
  name: string;
  mainRepoPath?: string;
  tool?: string;
  externalId?: string;
}

interface WriteSessionDocArgs {
  sessionId: string;
  filename: string;
  content: string;
}

interface CleanupSessionArgs {
  sessionId: string;
  keepLast?: number;
}

interface RecordDecisionArgs {
  sessionId: string;
  decision: string;
}

interface ReviewPRArgs {
  prLink: string;
  mode?: 'inbound' | 'outbound';
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const cwd = process.cwd();

  switch (name) {
    case 'init_repo': {
      const { mainRepoPath } = args as { mainRepoPath?: string };
      return { content: [{ type: 'text', text: initRepo(cwd, mainRepoPath) }] };
    }

    case 'check_status':
      return { content: [{ type: 'text', text: checkDNAStatus(cwd).message }] };

    case 'init_context': {
      const status = checkDNAStatus(cwd);
      const context = initContext(cwd);
      return {
        content: [
          {
            type: 'text',
            text: `${status.message}\n\n${context}`,
          },
        ],
      };
    }

    case 'start_session': {
      const { name: sessionName, mainRepoPath, tool, externalId } = args as unknown as StartSessionArgs;
      const session = startSession(cwd, sessionName, mainRepoPath, { tool, externalId });
      return {
        content: [
          {
            type: 'text',
            text: `📓 DNA Session started: ${session.sessionId}\n📁 Logs: ${
              session.logPath
            }\n🔗 Mode: ${session.mode}${
              'mainPath' in session && session.mainPath ? ` (Main: ${session.mainPath})` : ''
            }`,
          },
        ],
      };
    }

    case 'resume_session': {
      const { sessionId } = args as { sessionId?: string };
      const result = resumeSession(cwd, sessionId);
      return {
        content: [
          {
            type: 'text',
            text: `${result.message}\n\n--- HANDOFF ---\n${result.handoff}\n\n--- MANIFEST ---\n${result.manifest}\n\n--- DECISIONS ---\n${result.decisions}`,
          },
        ],
      };
    }

    case 'write_session_doc': {
      const { sessionId, filename, content } = args as unknown as WriteSessionDocArgs;
      const doc = writeSessionDoc(cwd, sessionId, filename, content);
      return {
        content: [
          {
            type: 'text',
            text: `📄 DNA Document written: ${doc.filename}\n📍 Path: ${doc.path}\n🔢 Version: ${doc.version}`,
          },
        ],
      };
    }

    case 'cleanup_session': {
      const { sessionId, keepLast } = args as unknown as CleanupSessionArgs;
      const cleanup = cleanupSession(cwd, sessionId, keepLast);
      return { content: [{ type: 'text', text: cleanup.message }] };
    }

    case 'record_decision': {
      const { sessionId, decision } = args as unknown as RecordDecisionArgs;
      return {
        content: [
          {
            type: 'text',
            text: recordDecision(cwd, sessionId, decision),
          },
        ],
      };
    }

    case 'review_pr': {
      const { prLink, mode } = args as unknown as ReviewPRArgs;
      const reviewResult = await reviewPR(prLink, mode || 'outbound');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(reviewResult, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Code DNA MCP Server running on stdio');
}

main().catch(console.error);
