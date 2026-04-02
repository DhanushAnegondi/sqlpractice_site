"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
}

export function SqlEditor({ value, onChange, height = "280px" }: SqlEditorProps) {
  return (
    <div className="rounded-md border border-input overflow-hidden">
      <MonacoEditor
        height={height}
        defaultLanguage="sql"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          tabSize: 2,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
