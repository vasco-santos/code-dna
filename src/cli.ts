import sade from 'sade';
import {
  initRepo,
  startSession,
  recordDecision,
  reviewPR,
  linkAuth,
  initContext,
  writeSessionDoc,
  cleanupSession,
  listSessions,
  getSessionStatus,
  switchSession,
  proposeMutation,
} from './actions';

const prog = sade('dna');

prog.version('1.0.0').describe('Code DNA: Experienced-level Engineering DNA for AI Agents');

prog
  .command('init')
  .describe('Initialize a repository with Global Engineering DNA')
  .action(() => {
    console.log(initRepo(process.cwd()));
    console.log('✅ Code DNA initialized successfully!');
  });

prog
  .command('init_context')
  .describe('Initialize repository-specific context (architecture, idioms, devops)')
  .action(() => {
    console.log(initContext(process.cwd()));
  });

prog
  .command('auth link')
  .describe('Link current GitHub CLI token to Code DNA for background processes')
  .action(() => {
    console.log(linkAuth());
  });

prog
  .command('session start <name>')
  .option('--main <path>', 'Path to main repo if this is a linked session')
  .option('--tool <name>', 'Name of the tool driving the session (e.g., gemini-cli)')
  .option('--external-id <id>', 'External conversation or chat ID')
  .describe('Start a new DNA session with logging')
  .action((name, opts) => {
    const session = startSession(process.cwd(), name, opts.main, {
      tool: opts.tool,
      externalId: opts['external-id'],
    });
    console.log(`📓 Session started: ${session.sessionId}`);
    console.log(`📁 Log path: ${session.logPath}`);
    console.log(`🔗 Mode: ${session.mode}`);
  });

prog
  .command('session list')
  .describe('List all DNA sessions in this repository')
  .action(() => {
    const sessions = listSessions(process.cwd());
    if (sessions.length === 0) {
      console.log('No sessions found.');
      return;
    }
    console.table(
      sessions.map((s: { id: string; name: string; startedAt: string; isActive: boolean }) => ({
        ID: s.id,
        Name: s.name,
        Started: s.startedAt,
        Active: s.isActive ? '✅' : '',
      })),
    );
  });

prog
  .command('session status [id]')
  .describe('Show the status of the current or specified session')
  .action((id) => {
    try {
      const status = getSessionStatus(process.cwd(), id);
      console.log(`\n📊 Session Status: ${status.id}`);
      console.log(`------------------------------------------`);
      console.log(`Tool: ${status.metadata.tool}`);
      console.log(`DNA Version: ${status.metadata.dnaVersion}`);
      console.log(`Decisions Recorded: ${status.decisionCount}`);
      console.log(`\n--- Manifest Snippet ---`);
      console.log(status.manifestSummary);
      console.log(`------------------------------------------\n`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${message}`);
    }
  });

prog
  .command('session switch <id>')
  .describe('Switch the active session to the specified ID')
  .action((id) => {
    try {
      console.log(switchSession(process.cwd(), id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${message}`);
    }
  });

prog
  .command('session record [id] <decision>')
  .describe('Record an architectural decision in an active session')
  .action((id, decision) => {
    // If only one argument provided, it's the decision for the active session
    const finalId = decision ? id : undefined;
    const finalDecision = decision || id;
    try {
      console.log(recordDecision(process.cwd(), finalId, finalDecision));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${message}`);
    }
  });

prog
  .command('session doc [id] <filename> <content>')
  .describe('Write a versioned document to a session')
  .action((id, filename, content) => {
    const finalId = content ? id : undefined;
    const finalFilename = content ? filename : id;
    const finalContent = content || filename;
    try {
      const doc = writeSessionDoc(process.cwd(), finalId, finalFilename, finalContent);
      console.log(`📄 Document written: ${doc.filename} (v${doc.version})`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${message}`);
    }
  });

prog
  .command('session cleanup [id]')
  .option('--keep <count>', 'Number of recent versions to keep', 3)
  .describe('Cleanup old versions of session documents')
  .action((id, opts) => {
    try {
      const result = cleanupSession(process.cwd(), id, parseInt(opts.keep, 10));
      console.log(result.message);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${message}`);
    }
  });

prog
  .command('review inbound <pr>')
  .describe('Analyze PR feedback and suggest fixes based on Engineering DNA')
  .action(async (pr) => {
    console.log(`📥 Analyzing inbound feedback for PR: ${pr}`);
    try {
      const result = await reviewPR(pr, 'inbound');
      console.log(JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${message}`);
    }
  });

prog
  .command('review outbound <pr>')
  .describe('Perform a first-pass review of a PR against Engineering DNA')
  .action(async (pr) => {
    console.log(`📤 Performing outbound review for PR: ${pr}`);
    try {
      const result = await reviewPR(pr, 'outbound');
      console.log(JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${message}`);
    }
  });

prog
  .command('mutation propose <title> <rationale>')
  .option('--session <id>', 'Session ID to link this mutation to')
  .describe('Propose an architectural improvement to the Global DNA')
  .action((title, rationale, opts) => {
    try {
      const result = proposeMutation(process.cwd(), title, rationale, opts.session);
      console.log(result.message);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${message}`);
    }
  });

prog.parse(process.argv);
