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
} from './actions';

const prog = sade('dna');

prog.version('1.1.0').describe('Code DNA: Staff-level Engineering DNA for AI Agents');

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
  .describe('Start a new DNA session with logging')
  .action((name, opts) => {
    const session = startSession(process.cwd(), name, opts.main);
    console.log(`📓 Session started: ${session.sessionId}`);
    console.log(`📁 Log path: ${session.logPath}`);
    console.log(`🔗 Mode: ${session.mode}`);
  });

prog
  .command('session record <id> <decision>')
  .describe('Record an architectural decision in an active session')
  .action((id, decision) => {
    try {
      console.log(recordDecision(process.cwd(), id, decision));
    } catch (err: any) {
      console.error(`❌ ${err.message}`);
    }
  });

prog
  .command('session doc <id> <filename> <content>')
  .describe('Write a versioned document to a session')
  .action((id, filename, content) => {
    try {
      const doc = writeSessionDoc(process.cwd(), id, filename, content);
      console.log(`📄 Document written: ${doc.filename} (v${doc.version})`);
    } catch (err: any) {
      console.error(`❌ ${err.message}`);
    }
  });

prog
  .command('session cleanup <id>')
  .option('--keep <count>', 'Number of recent versions to keep', 3)
  .describe('Cleanup old versions of session documents')
  .action((id, opts) => {
    try {
      const result = cleanupSession(process.cwd(), id, parseInt(opts.keep, 10));
      console.log(result.message);
    } catch (err: any) {
      console.error(`❌ ${err.message}`);
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
    } catch (err: any) {
      console.error(`❌ ${err.message}`);
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
    } catch (err: any) {
      console.error(`❌ ${err.message}`);
    }
  });

prog.parse(process.argv);
