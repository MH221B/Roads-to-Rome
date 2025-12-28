interface ICodeService {
  runCode(
    code: string,
    language: string,
    stdin?: string
  ): Promise<{ message: string; output?: string }>;
}

type RuntimeSpec = { language: string; version: string };

const RUNTIMES: Record<string, RuntimeSpec> = {
  javascript: { language: 'javascript', version: '18.15.0' }, // Uses Node.js
  typescript: { language: 'typescript', version: '5.0.3' }, // Uses ts-node
  python: { language: 'python', version: '3.10.0' }, // Uses CPython
  cpp: { language: 'cpp', version: '10.2.0' }, // Uses gcc
  java: { language: 'java', version: '15.0.2' }, // Uses OpenJDK
  csharp: { language: 'csharp', version: '6.12.0' }, // Uses Mono
  go: { language: 'go', version: '1.16.2' },
  rust: { language: 'rust', version: '1.50.0' },
  sqlite3: { language: 'sqlite3', version: '3.36.0' },
};

const fetchLatestRuntimeVersion = async (
  pistonUrl: string,
  language: string
): Promise<string | null> => {
  try {
    const resp = await fetch(`${pistonUrl}/api/v2/piston/runtimes`);
    if (!resp.ok) return null;
    const runtimes: RuntimeSpec[] = await resp.json();
    const matches = runtimes.filter((rt) => rt.language.toLowerCase() === language.toLowerCase());
    if (!matches.length) return null;
    // Piston returns runtimes newest-first today, but keep the last as a simple fallback.
    return matches[0]?.version || null;
  } catch (_) {
    return null;
  }
};

const codeService: ICodeService = {
  async runCode(
    code: string,
    language: string,
    stdin: string = '',
    timeLimit: number = 3,
    memoryLimit: number = 128000
  ) {
    // we will interact with PISTON API here to run the code
    // PISTON API is either self-hosted or a third-party service(cloud of Judge0)
    // we are currently self-hosting it using Docker
    const PISTON_URL = process.env.PISTON_URL || 'http://localhost:2000';

    language = language.toLowerCase();
    const runtime = RUNTIMES[language];
    if (!runtime) {
      throw new Error(`Unsupported language: ${language}`);
    }
    if (timeLimit <= 0 || timeLimit > 3) {
      timeLimit = 3; // enforce max time limit of 3 seconds
    }
    if (memoryLimit <= 0 || memoryLimit > 128000) {
      memoryLimit = 128000; // enforce max memory limit of 128 MB
    }
    const executeOnce = async (runtimeSpec: RuntimeSpec) => {
      const payload = {
        language: runtimeSpec.language,
        version: runtimeSpec.version,
        files: [{ content: code }],
        stdin,
        args: [],
        compile_timeout: 10000,
        run_timeout: timeLimit * 1000, // in ms
        run_memory_limit: memoryLimit * 1024, // convert KB to bytes
      };

      let response;
      try {
        response = await fetch(`${PISTON_URL}/api/v2/piston/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to reach Piston at ${PISTON_URL}: ${reason}`);
      }
      const errorDetail = !response.ok ? await response.json().catch(() => undefined) : undefined;
      if (!response.ok) {
        const message = errorDetail?.message || response.statusText || response.status;
        throw new Error(message);
      }
      return response.json();
    };

    let result;
    try {
      result = await executeOnce(runtime);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes('unknown') || message.toLowerCase().includes('runtime')) {
        const latestVersion = await fetchLatestRuntimeVersion(PISTON_URL, runtime.language);
        if (latestVersion && latestVersion !== runtime.version) {
          result = await executeOnce({ ...runtime, version: latestVersion });
        } else {
          throw new Error(`Piston API Error: ${message}`);
        }
      } else {
        throw new Error(`Piston API Error: ${message}`);
      }
    }

    // Process the result
    // Compilation check
    // TO = Time Out, SG = Signal, RE = Runtime Error
    if (result.compile && result.compile.code !== 0) {
      if (result.compile.status === 'TO') {
        return { message: 'Compilation Time Limit Exceeded' };
      }
      return {
        message: 'Compilation Error',
        output: result.compile.stderr || result.compile.message,
      };
    }
    // Execution check
    if (result.run) {
      if (result.run.code === 0) {
        return { message: 'Code executed successfully', output: result.run.stdout };
      } else {
        if (result.run.status === 'TO') {
          return { message: 'Time Limit Exceeded' };
        }
        if (result.run.signal === 'SIGKILL') {
          return {
            message: 'Runtime Error (Process Killed)',
            output: 'Process killed. Possible Memory Limit Exceeded.',
          };
        }
        return { message: `Runtime Error`, output: result.run.stderr || result.run.message };
      }
    }
    throw new Error('Unexpected response from Piston');
  },
};

export default codeService;
