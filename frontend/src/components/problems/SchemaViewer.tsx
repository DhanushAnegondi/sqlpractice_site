"use client";

import { useState } from "react";
import type { SchemaTableOut } from "@/types/api";

interface SchemaViewerProps {
  tables: SchemaTableOut[];
  sampleData: Record<string, Record<string, unknown>[]>;
}

export function SchemaViewer({ tables, sampleData }: SchemaViewerProps) {
  const [openTable, setOpenTable] = useState<string | null>(tables[0]?.table_name ?? null);
  const [tab, setTab] = useState<"schema" | "data">("schema");

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab("schema")}
          className={`text-xs px-3 py-1 rounded-full transition-colors ${tab === "schema" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          Schema
        </button>
        <button
          onClick={() => setTab("data")}
          className={`text-xs px-3 py-1 rounded-full transition-colors ${tab === "data" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          Sample Data
        </button>
      </div>

      {tables.map((table) => (
        <div key={table.table_name} className="rounded-md border overflow-hidden">
          <button
            onClick={() => setOpenTable(openTable === table.table_name ? null : table.table_name)}
            className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 text-sm font-mono font-medium hover:bg-muted/80 transition-colors"
          >
            <span>{table.table_name}</span>
            <span className="text-muted-foreground text-xs">{openTable === table.table_name ? "▲" : "▼"}</span>
          </button>

          {openTable === table.table_name && (
            <div>
              {tab === "schema" && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">column</th>
                      <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">type</th>
                      <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">nullable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((col) => (
                      <tr key={col.name} className="border-b last:border-0">
                        <td className="px-3 py-1.5 font-mono">{col.name}</td>
                        <td className="px-3 py-1.5 text-blue-600 font-mono">{col.type}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{col.nullable ? "yes" : "no"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tab === "data" && sampleData[table.table_name] && (
                <div className="overflow-auto max-h-48">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        {table.columns.map((col) => (
                          <th key={col.name} className="text-left px-3 py-1.5 font-medium text-muted-foreground whitespace-nowrap">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sampleData[table.table_name].map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          {table.columns.map((col) => (
                            <td key={col.name} className="px-3 py-1.5 font-mono whitespace-nowrap">
                              {row[col.name] === null || row[col.name] === undefined ? (
                                <span className="text-muted-foreground italic">NULL</span>
                              ) : (
                                String(row[col.name])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
