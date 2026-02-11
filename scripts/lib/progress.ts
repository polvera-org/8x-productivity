// ---------------------------------------------------------------------------
// Sticky terminal footer with step progress display
// ---------------------------------------------------------------------------

export type StepStatus = "pending" | "running" | "done" | "failed";

export interface StepState {
  title: string;
  stageTitle?: string;
  status: StepStatus;
  duration?: string; // e.g. "1m23s"
}

// ANSI helpers
const ESC = "\x1b";
const CSI = `${ESC}[`;

const ANSI = {
  /** Set scroll region rows top..bottom (1-based) */
  scrollRegion: (top: number, bottom: number) => `${CSI}${top};${bottom}r`,
  /** Reset scroll region to full terminal */
  scrollRegionReset: () => `${CSI}r`,
  /** Move cursor to row, col (1-based) */
  cursorTo: (row: number, col: number) => `${CSI}${row};${col}H`,
  /** Save cursor position */
  cursorSave: () => `${ESC}7`,
  /** Restore cursor position */
  cursorRestore: () => `${ESC}8`,
  /** Clear from cursor to end of screen */
  clearToEnd: () => `${CSI}0J`,
  /** Clear entire line */
  clearLine: () => `${CSI}2K`,
  /** Hide cursor */
  cursorHide: () => `${CSI}?25l`,
  /** Show cursor */
  cursorShow: () => `${CSI}?25h`,
  /** Begin synchronized output (reduces flicker) */
  syncStart: () => `${CSI}?2026h`,
  /** End synchronized output */
  syncEnd: () => `${CSI}?2026l`,
  // Styles
  bold: (s: string) => `${CSI}1m${s}${CSI}0m`,
  dim: (s: string) => `${CSI}2m${s}${CSI}0m`,
  green: (s: string) => `${CSI}32m${s}${CSI}0m`,
  cyan: (s: string) => `${CSI}36m${s}${CSI}0m`,
  red: (s: string) => `${CSI}31m${s}${CSI}0m`,
  yellow: (s: string) => `${CSI}33m${s}${CSI}0m`,
  greenBold: (s: string) => `${CSI}32;1m${s}${CSI}0m`,
  cyanBold: (s: string) => `${CSI}36;1m${s}${CSI}0m`,
};

// ---------------------------------------------------------------------------
// Step progress renderer
// ---------------------------------------------------------------------------

const ICON_DONE = ANSI.green("✔");
const ICON_RUNNING = ANSI.cyan("▸");
const ICON_PENDING = ANSI.dim("○");
const ICON_FAILED = ANSI.red("✘");

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

/**
 * Render step progress lines for display in the footer.
 * Returns an array of formatted lines (without trailing newlines).
 */
export function renderStepProgress(
  steps: StepState[],
  cols: number,
): string[] {
  const lines: string[] = [];

  // Separator
  lines.push(ANSI.dim("─".repeat(cols)));

  for (const step of steps) {
    let icon: string;
    let suffix = "";

    // Truncate the visible title to fit the terminal width
    const maxTitle = Math.max(20, cols - 10);
    const title = truncate(step.title, maxTitle);

    let titleText: string;

    switch (step.status) {
      case "done":
        icon = ICON_DONE;
        titleText = title;
        if (step.duration) suffix = ANSI.dim(` (${step.duration})`);
        break;
      case "running":
        icon = ICON_RUNNING;
        titleText = ANSI.bold(title);
        if (step.duration) suffix = ANSI.dim(` (${step.duration})`);
        break;
      case "failed":
        icon = ICON_FAILED;
        titleText = ANSI.red(title);
        if (step.duration) suffix = ANSI.dim(` (${step.duration})`);
        break;
      default:
        icon = ICON_PENDING;
        titleText = ANSI.dim(title);
        break;
    }

    const prefix = step.stageTitle
      ? `  ${icon} ${ANSI.dim(`[${step.stageTitle}]`)} `
      : `  ${icon} `;

    lines.push(`${prefix}${titleText}${suffix}`);
  }

  return lines;
}

// ---------------------------------------------------------------------------
// StickyFooter — manages a fixed region at the bottom of the terminal
// ---------------------------------------------------------------------------

export class StickyFooter {
  private footerLineCount = 0;
  private active = false;
  private cleanedUp = false;
  private boundCleanup: () => void;
  private boundResize: () => void;
  private lastFooterContent: string[] = [];

  constructor() {
    this.boundCleanup = () => this.cleanup();
    this.boundResize = () => this.handleResize();
  }

  /** Total terminal rows */
  private get rows(): number {
    return process.stdout.rows || 24;
  }

  /** Total terminal columns */
  private get cols(): number {
    return process.stdout.columns || 80;
  }

  /**
   * Activate the sticky footer, reserving `lineCount` lines at the bottom.
   */
  start(lineCount: number): void {
    if (!process.stdout.isTTY) return;
    this.footerLineCount = lineCount;
    this.active = true;

    // Register cleanup handlers
    process.on("exit", this.boundCleanup);
    process.on("SIGINT", this.onSignal.bind(this, "SIGINT"));
    process.on("SIGTERM", this.onSignal.bind(this, "SIGTERM"));
    process.stdout.on("resize", this.boundResize);

    // Set up scroll region: top of screen to (rows - footerLines)
    const scrollBottom = this.rows - this.footerLineCount;
    if (scrollBottom < 1) return; // terminal too small

    // Move to the bottom of the screen and add enough blank lines
    // so existing content scrolls up and we have room for the footer
    process.stdout.write(ANSI.cursorTo(this.rows, 1));
    for (let i = 0; i < this.footerLineCount; i++) {
      process.stdout.write("\n");
    }

    // Set scroll region
    process.stdout.write(ANSI.scrollRegion(1, scrollBottom));

    // Move cursor to the top of the scroll region (where agent output goes)
    process.stdout.write(ANSI.cursorTo(scrollBottom, 1));
  }

  /**
   * Write agent output into the scrollable region (above the footer).
   * Call this to relay piped child process output.
   */
  writeOutput(text: string): void {
    if (!this.active) {
      process.stdout.write(text);
      return;
    }

    // Save cursor, ensure we're in the scroll region, write, restore
    // Actually, the cursor should already be in the scroll region
    // since we set it up that way. Just write directly.
    process.stdout.write(text);
  }

  /**
   * Write agent stderr output.
   */
  writeError(text: string): void {
    if (!this.active) {
      process.stderr.write(text);
      return;
    }
    // Relay stderr through stdout so it appears in the scroll region
    // (stderr doesn't respect scroll regions since it goes to the same TTY)
    process.stdout.write(text);
  }

  /**
   * Update the footer content. Pass an array of lines to display.
   */
  update(lines: string[]): void {
    if (!this.active) return;
    this.lastFooterContent = lines;
    this.renderFooter(lines);
  }

  /**
   * Clean up: reset scroll region, move cursor to bottom, show cursor.
   * Safe to call multiple times.
   */
  cleanup(): void {
    if (this.cleanedUp) return;
    this.cleanedUp = true;
    this.active = false;

    if (!process.stdout.isTTY) return;

    // Reset scroll region to full terminal
    process.stdout.write(ANSI.scrollRegionReset());
    // Move cursor to the very bottom
    process.stdout.write(ANSI.cursorTo(this.rows, 1));
    // Show cursor
    process.stdout.write(ANSI.cursorShow());
    // Print a newline so the shell prompt starts on a fresh line
    process.stdout.write("\n");

    // Remove listeners
    process.removeListener("exit", this.boundCleanup);
    process.stdout.removeListener("resize", this.boundResize);
  }

  // -- Private ----------------------------------------------------------------

  private renderFooter(lines: string[]): void {
    const footerStart = this.rows - this.footerLineCount + 1;
    if (footerStart < 1) return;

    // Use synchronized output to reduce flicker
    let out = ANSI.syncStart();

    // Save cursor position (in the scroll region)
    out += ANSI.cursorSave();

    // Move to footer area
    out += ANSI.cursorTo(footerStart, 1);

    // Write each footer line, clearing the line first
    for (let i = 0; i < this.footerLineCount; i++) {
      out += ANSI.clearLine();
      if (i < lines.length) {
        out += lines[i];
      }
      if (i < this.footerLineCount - 1) {
        out += "\n";
      }
    }

    // Restore cursor position (back in scroll region)
    out += ANSI.cursorRestore();

    // End synchronized output
    out += ANSI.syncEnd();

    process.stdout.write(out);
  }

  private handleResize(): void {
    if (!this.active) return;

    const scrollBottom = this.rows - this.footerLineCount;
    if (scrollBottom < 1) return;

    // Update scroll region for new terminal size
    process.stdout.write(ANSI.scrollRegion(1, scrollBottom));

    // Re-render footer
    if (this.lastFooterContent.length > 0) {
      this.renderFooter(this.lastFooterContent);
    }
  }

  private onSignal(signal: string): void {
    this.cleanup();
    // Re-raise the signal so the process exits with the correct code
    process.kill(process.pid, signal as NodeJS.Signals);
  }
}
