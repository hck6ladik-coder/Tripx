import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { executeTerminalCommand } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  terminalId: string;
}

export function Terminal({ terminalId: _terminalId }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const { currentProject } = useAppStore();

  const cwdRef = useRef(currentProject?.path || 'd:\\trip');
  const bufferRef = useRef('');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isExecutingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Menlo, monospace',
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

    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    terminalRef.current = term;

    // Welcome banner
    term.writeln('\x1b[38;2;124;140;255m⚡ hck6lada CodeSpace Terminal (PowerShell)\x1b[0m');
    term.writeln('\x1b[90mLokální prostředí: ' + cwdRef.current + ' | Připraveno pro spouštění příkazů\x1b[0m');
    term.writeln('');

    const printPrompt = () => {
      const displayPath = cwdRef.current.replace(/\\/g, '/');
      term.write(`\x1b[32mPS \x1b[36m${displayPath}\x1b[0m> `);
    };

    printPrompt();

    // Interactive Key Handling
    term.onData(async (data: string) => {
      if (isExecutingRef.current) return;

      // Enter key
      if (data === '\r' || data === '\n') {
        const cmd = bufferRef.current.trim();
        term.writeln('');
        bufferRef.current = '';

        if (!cmd) {
          printPrompt();
          return;
        }

        // Save to history
        if (historyRef.current[historyRef.current.length - 1] !== cmd) {
          historyRef.current.push(cmd);
        }
        historyIndexRef.current = historyRef.current.length;

        // Builtin: clear / cls
        if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
          term.clear();
          printPrompt();
          return;
        }

        // Builtin: cd <dir>
        if (cmd.toLowerCase().startsWith('cd ')) {
          const targetDir = cmd.slice(3).trim();
          isExecutingRef.current = true;
          const res = await executeTerminalCommand(`cd "${targetDir}"; (Get-Location).Path`, cwdRef.current);
          isExecutingRef.current = false;

          if (res.exitCode === 0 && res.stdout.trim()) {
            cwdRef.current = res.stdout.trim().split(/\r?\n/).pop() || cwdRef.current;
          } else if (res.stderr) {
            term.writeln(`\x1b[31m${res.stderr.trim()}\x1b[0m`);
          }
          printPrompt();
          return;
        }

        // Execute via backend
        isExecutingRef.current = true;
        term.write('\x1b[90m⏳ Spouštím...\x1b[0m\r');

        const result = await executeTerminalCommand(cmd, cwdRef.current);
        isExecutingRef.current = false;

        // Clear the status line
        term.write('\x1b[2K\r');

        if (result.stdout) {
          const formatted = result.stdout.replace(/\r?\n/g, '\r\n');
          term.write(formatted);
          if (!formatted.endsWith('\r\n')) term.writeln('');
        }

        if (result.stderr) {
          const formatted = result.stderr.replace(/\r?\n/g, '\r\n');
          term.writeln(`\x1b[31m${formatted}\x1b[0m`);
        }

        printPrompt();
        return;
      }

      // Backspace
      if (data === '\x7f' || data === '\b') {
        if (bufferRef.current.length > 0) {
          bufferRef.current = bufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      // Ctrl + C (SIGINT)
      if (data === '\x03') {
        bufferRef.current = '';
        term.writeln('^C');
        printPrompt();
        return;
      }

      // History navigation: Arrow Up
      if (data === '\x1b[A') {
        if (historyRef.current.length > 0 && historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const prevCmd = historyRef.current[historyIndexRef.current];

          // Erase current buffer from display
          while (bufferRef.current.length > 0) {
            term.write('\b \b');
            bufferRef.current = bufferRef.current.slice(0, -1);
          }

          bufferRef.current = prevCmd;
          term.write(prevCmd);
        }
        return;
      }

      // History navigation: Arrow Down
      if (data === '\x1b[B') {
        if (historyIndexRef.current < historyRef.current.length - 1) {
          historyIndexRef.current++;
          const nextCmd = historyRef.current[historyIndexRef.current];

          while (bufferRef.current.length > 0) {
            term.write('\b \b');
            bufferRef.current = bufferRef.current.slice(0, -1);
          }

          bufferRef.current = nextCmd;
          term.write(nextCmd);
        } else if (historyIndexRef.current === historyRef.current.length - 1) {
          historyIndexRef.current = historyRef.current.length;
          while (bufferRef.current.length > 0) {
            term.write('\b \b');
            bufferRef.current = bufferRef.current.slice(0, -1);
          }
        }
        return;
      }

      // Ignore unhandled escape sequences
      if (data.startsWith('\x1b')) {
        return;
      }

      // Standard printable characters
      bufferRef.current += data;
      term.write(data);
    });

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch {
        // ignore unmount fit error
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      terminalRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full w-full p-2"
      style={{ background: '#0B0D12' }}
    />
  );
}
