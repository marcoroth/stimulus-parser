import type { SourceLocation } from "acorn"

export class ParseError {
  public readonly severity: "LINT" | "FAIL";
  public readonly message: string;
  public readonly loc?: SourceLocation | null;
  public readonly cause?: Error;

  constructor(
    severity: "LINT" | "FAIL",
    message: string,
    loc?: SourceLocation | null,
    cause?: Error,
  ) {
    this.severity = severity;
    this.message = message;
    this.loc = loc;
    this.cause = cause;
  }

  get inspect(): object {
    return {
      severity: this.severity,
      message: this.message,
    }
  }
}
