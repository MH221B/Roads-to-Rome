import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { api } from '../services/axiosClient';

const languageOptions = [
  { value: 'python', label: 'Python 3' },
  { value: 'cpp', label: 'C++17' },
] as const;

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

  useEffect(() => {
    setCode(getTemplateForLanguage(language, starterCode));
    setOutput('Run code to see output.');
  }, [language, starterCode]);

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

  return (
    <Card className="h-full border-l border-slate-200 bg-white p-0 shadow-none">
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

      <div className="flex-1 overflow-hidden bg-slate-950">
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

      <div className="border-t border-slate-200 bg-slate-900 px-4 py-3 text-slate-50">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-slate-400">
          <span>Output</span>
          <span className="text-slate-300">{languageLabel}</span>
        </div>
        <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-black/50 px-3 py-2 text-xs text-slate-100">
          {output}
        </pre>
      </div>
    </Card>
  );
}
