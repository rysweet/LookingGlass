export {
  type ExtractMethodOptions,
  type ExtractMethodResult,
  type InlineMethodOptions,
  type InlineMethodResult,
  RefactoringError,
  type RenameResult,
} from "./refactoring/types.js";
export { renameDeclaration } from "./refactoring/rename.js";
export { extractMethod } from "./refactoring/extract.js";
export { inlineMethodBody } from "./refactoring/inline.js";
