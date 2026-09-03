import React from "react";
import ReactMarkdown from "react-markdown";

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export default function FormattedMarkdown({
  content,
  className = "",
}: FormattedMarkdownProps) {
  return (
    <div className={`formatted-markdown text-xs sm:text-sm leading-relaxed text-zinc-200 ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children, ...props }) => (
            <h1
              className="text-lg sm:text-xl font-extrabold text-white mt-5 mb-3 pb-2 border-b border-zinc-800 flex items-center gap-2"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="text-base sm:text-lg font-bold text-cyan-400 mt-5 mb-2.5 flex items-center gap-2"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="text-xs sm:text-sm font-semibold text-cyan-200 mt-3.5 mb-1.5"
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4
              className="text-xs font-semibold text-zinc-300 mt-3 mb-1"
              {...props}
            >
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p className="text-zinc-200 leading-relaxed mb-3 last:mb-0" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul
              className="list-disc list-outside ml-5 space-y-1.5 my-3 text-zinc-200 marker:text-cyan-400"
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol
              className="list-decimal list-outside ml-5 space-y-1.5 my-3 text-zinc-200 marker:text-cyan-400"
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed pl-1" {...props}>
              {children}
            </li>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-white text-cyan-50" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="text-zinc-300 italic" {...props}>
              {children}
            </em>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-cyan-500 bg-cyan-950/20 pl-3.5 py-2 my-3 rounded-r-lg text-xs italic text-zinc-300"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: ({ className, children, ...props }: any) => {
            const contentStr = String(children);
            const isBlock = contentStr.includes("\n") || /language-/.test(className || "");

            if (isBlock) {
              return (
                <code
                  className="block bg-zinc-950 text-cyan-200 p-3.5 rounded-xl text-xs font-mono border border-zinc-800/80 overflow-x-auto my-2.5 leading-relaxed"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                className="bg-zinc-800/90 text-cyan-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-zinc-700/50 mx-0.5"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre className="overflow-x-auto my-2.5 rounded-xl" {...props}>
              {children}
            </pre>
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-zinc-800 shadow-md">
              <table className="w-full text-xs text-left border-collapse" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead
              className="bg-zinc-900 border-b border-zinc-800 text-white font-semibold"
              {...props}
            >
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className="divide-y divide-zinc-800/70" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="hover:bg-zinc-900/40 transition-colors" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th
              className="px-3.5 py-2.5 font-semibold text-white text-xs border-r last:border-r-0 border-zinc-800"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className="px-3.5 py-2 text-zinc-300 text-xs border-r last:border-r-0 border-zinc-800/70"
              {...props}
            >
              {children}
            </td>
          ),
          hr: ({ ...props }) => (
            <hr className="border-zinc-800/80 my-4" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
