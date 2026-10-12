import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { createTerminalWebSocket } from '@/lib/api';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  terminalId: string;
}

export function Terminal({ terminalId }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      fontSize: 13,
      fontFamily: 'JetBrains Mono, monospace',
      theme: {
        background: '#0B0D12',
        foreground: '#F1F5F9',
        cursor: '#7C8CFF',
        selectionBackground: '#7C8CFF33',
        black: '#0B0D12',
        red: '#FB7185',
        green: '#34D399',
        yellow: '#FBBF24',
        blue: '#7C8CFF',
        magenta: '#C084FC',
        cyan: '#22D3EE',
        white: '#F1F5F9',
        brightBlack: '#293241',
        brightRed: '#FB7185',
        brightGreen: '#34D399',
        brightYellow: '#FBBF24',
        brightBlue: '#7C8CFF',
        brightMagenta: '#C084FC',
        brightCyan: '#22D3EE',
        brightWhite: '#FFFFFF',
      },
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      rows: 24,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(containerRef.current);

    // Delay fit to ensure container has dimensions
    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    // WebSocket connection
    const ws = createTerminalWebSocket(terminalId);

    ws.onopen = () => {
      term.writeln('\x1b[32m✓ Terminál připojen\x1b[0m');
    };

    ws.onmessage = (event: MessageEvent) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      term.writeln('\x1b[31m✗ Terminál odpojen\x1b[0m');
    };

    // Input handling
    term.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    terminalRef.current = term;

    // Resize handling
    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch {
        // ignore fit errors during unmount
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
      terminalRef.current = null;
    };
  }, [terminalId]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full p-2"
      style={{ background: '#0B0D12' }}
    />
  );
}
