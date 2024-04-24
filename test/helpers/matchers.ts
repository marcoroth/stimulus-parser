import type { SourceLocation } from "acorn"

export const extractLoc = (loc: SourceLocation) => [loc?.start?.line, loc?.start?.column, loc?.end?.line, loc?.end?.column]
