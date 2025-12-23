import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { api } from '../services/axiosClient';

const languageOptions = [
  { value: 'python', label: 'Python 3' },
  { value: 'cpp', label: 'C++17' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java 17' },
  { value: 'csharp', label: 'C# (Mono)' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sqlite3', label: 'SQLite' },
];

type SupportedLanguage = (typeof languageOptions)[number]['value'];
type StarterCode = string | Partial<Record<SupportedLanguage, string>>;

interface LessonCodeEditorProps {
  title?: string;
  starterCode?: StarterCode;
  initialLanguage?: SupportedLanguage;
  onRun?: (payload: { code: string; language: SupportedLanguage }) => Promise<string | void> | string | void;
  onReset?: () => void;
}

const defaultTemplates: Record<SupportedLanguage, string> = {
  python: '# Write your solution here\n\ndef solve(input: str):\n    return input\n\nprint(solve("sample input"))\n',
  cpp: `// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nstring solve(const string &input) {\n  return input;\n}\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n  cout << solve("sample input") << "\\n";\n  return 0;\n}\n`,
  javascript:
    '// Write your solution here\nfunction solve(input) {\n  return input;\n}\n\nconsole.log(solve("sample input"));\n',
  typescript:
    '// Write your solution here\nfunction solve(input: string): string {\n  return input;\n}\n\nconsole.log(solve("sample input"));\n',
  java: `// Write your solution here\nimport java.io.*;\nimport java.util.*;\n\npublic class Main {\n  private static String solve(String input) {\n    return input;\n  }\n\n  public static void main(String[] args) throws Exception {\n    System.out.println(solve("sample input"));\n  }\n}\n`,
  csharp:
    '// Write your solution here\nusing System;\n\nclass Program {\n  static string Solve(string input) {\n    return input;\n  }\n\n  static void Main() {\n    Console.WriteLine(Solve("sample input"));\n  }\n}\n',
  go:
    '// Write your solution here\npackage main\n\nimport "fmt"\n\nfunc solve(input string) string {\n  return input\n}\n\nfunc main() {\n  fmt.Println(solve("sample input"))\n}\n',
  rust:
    '// Write your solution here\nfn solve(input: &str) -> String {\n  input.to_string()\n}\n\nfn main() {\n  println!("{}", solve("sample input"));\n}\n',
  sqlite3:
    "-- Write your SQL here\nSELECT 'sample output' AS result;\n",
};

const getTemplateForLanguage = (language: SupportedLanguage, starterCode?: StarterCode) => {
  if (typeof starterCode === 'string') return starterCode;
  if (starterCode && starterCode[language]) return starterCode[language] as string;
  return defaultTemplates[language];
};

export default function LessonCodeEditor({
  title = 'Code Editor',
  starterCode,
  initialLanguage = 'python',
  onRun,
  onReset,
}: LessonCodeEditorProps) {
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [code, setCode] = useState<string>(() => getTemplateForLanguage(initialLanguage, starterCode));
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('Run code to see output.');
  const [outputHeight, setOutputHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(200);

  useEffect(() => {
    setCode(getTemplateForLanguage(language, starterCode));
    setOutput('Run code to see output.');
  }, [language, starterCode]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const delta = startY - event.clientY;
      const nextHeight = Math.min(Math.max(startHeight + delta, 120), 640);
      setOutputHeight(nextHeight);
    };

    const handleMouseUp = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startHeight, startY]);

  const languageLabel = useMemo(
    () => languageOptions.find((opt) => opt.value === language)?.label || language,
    [language]
  );

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const response = await api.post('/api/code/runCodeSandbox', { code, language });
      const message = response.data?.output || response.data?.message || 'Submission successful.';
      setOutput(message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit code.';
      setOutput(message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(getTemplateForLanguage(language, starterCode));
    setOutput('Run code to see output.');
    onReset?.();
  };

  const handleResizeStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    setIsResizing(true);
    setStartY(event.clientY);
    setStartHeight(outputHeight);
    event.preventDefault();
  };

  return (
    <Card className="flex h-full flex-col border-l border-slate-200 bg-white p-0 shadow-none">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Interactive</span>
          <p className="truncate text-sm font-semibold text-slate-900" title={title}>
            {title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="border-slate-200 text-slate-700">
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isRunning ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <span className="uppercase tracking-wide text-slate-500">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
          >
            {languageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-[11px] uppercase tracking-[0.08em] text-slate-500">Monaco Editor</div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 min-h-0 overflow-hidden bg-slate-950">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme="vs-dark"
            onChange={(value) => setCode(value ?? '')}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              smoothScrolling: true,
              tabSize: 2,
            }}
          />
        </div>

        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize output pane"
          className="h-1 w-full cursor-row-resize bg-slate-200 hover:bg-slate-300"
          onMouseDown={handleResizeStart}
        />

        <div
          className="border-t border-slate-200 bg-slate-900 px-4 py-3 text-slate-50"
          style={{ flex: `0 0 ${outputHeight}px`, minHeight: 120, maxHeight: 640 }}
        >
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-slate-400">
            <span>Output</span>
            <span className="text-slate-300">{languageLabel}</span>
          </div>
          <pre className="mt-2 h-[calc(100%-18px)] overflow-auto rounded-md bg-black/50 px-3 py-2 text-xs text-slate-100">
            {output}
          </pre>
        </div>
      </div>
    </Card>
  );
}
