import type { SourceLocation } from "acorn"

export class ParseError {
  constructor(
    public readonly severity: "LINT" | "FAIL",
    public readonly message: string,
    public readonly loc?: SourceLocation | null,
    public readonly cause?: Error,
  ) {}

  get inspect(): object {
    return {
      severity: this.severity,
      message: this.message,
    }
  }
}
