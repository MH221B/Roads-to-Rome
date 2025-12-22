import { time } from "console";

interface ICodeService {
  runCode(code: string, language: string, stdin?: string): Promise<{ message: string; output?: string }>;
}

interface PistonStage {
  stdout: string;
  stderr: string;
  output: string;
  code: number;
  signal: string | null;
  status?: string; // 'TO' (Timeout), 'SG' (Signal), 'RE' (Runtime Error), etc.
}

interface PistonResult {
  language: string;
  version: string;
  run: PistonStage;
  compile?: PistonStage;
}

const RUNTIMES: Record<string, { language: string; version: string }> = {
    javascript: { language: 'javascript', version: '18.15.0' }, // Uses Node.js for later implementation
    python: { language: 'python', version: '3.10.0' },
    cpp: { language: 'cpp', version: '10.2.0' }, // Uses gcc
    java: { language: 'java', version: '15.0.2' }, // Uses OpenJDK // for later implementation
}

const codeService: ICodeService = {
  async runCode(code: string, language: string, stdin: string = '', timeLimit: number = 3,
    memoryLimit: number = 128000) {
    // we will interact with PISTON API here to run the code
    // PISTON API is either self-hosted or a third-party service(cloud of Judge0)
    // we are currently self-hosting it using Docker
    const PISTON_URL = process.env.PISTON_URL || 'http://localhost:2000';
    
    language = language.toLowerCase();
    const runtime = RUNTIMES[language];
    if (!runtime) {
      throw new Error(`Unsupported language: ${language}`);
    }
    if(timeLimit <= 0 || timeLimit > 3) {
      timeLimit = 3; // enforce max time limit of 3 seconds
    }
    if(memoryLimit <= 0 || memoryLimit > 128000) {
      memoryLimit = 128000; // enforce max memory limit of 128 MB
    }
    // Prepare the payload for Piston
    const payload = {
      language: runtime.language,
      version: runtime.version,
      files: [{ content: code }],
      stdin,
      args: [],
      compile_timeout: 10000,
      run_timeout: timeLimit * 1000, // in ms
      run_memory_limit: memoryLimit * 1024, // convert KB to bytes
    };
    // Submit the code to Piston
    let response;
    try {
      response = await fetch(`${PISTON_URL}/api/v2/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to reach Piston at ${PISTON_URL}: ${reason}`);
    }
    if (!response.ok) {
      const errorDetail = await response.json(); // Piston usually sends a JSON error message
      console.error("Piston Error Detail:", errorDetail);
      throw new Error(`Piston API Error: ${errorDetail.message || response.status}`);
    }
    const result = await response.json();

    // Process the result
    // Compilation check
    // TO = Time Out, SG = Signal, RE = Runtime Error
    if (result.compile && result.compile.code !== 0) {
      if (result.compile.status === 'TO') {
        return { message: 'Compilation Time Limit Exceeded' };
      }
      return { message: 'Compilation Error', output: result.compile.stderr || result.compile.message };
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
            return { message: 'Runtime Error (Process Killed)', output: 'Process killed. Possible Memory Limit Exceeded.' };
        }
        return { message: `Runtime Error`, output: result.run.stderr || result.run.message };
      }
    }
    throw new Error('Unexpected response from Piston');
  }
};

export default codeService;