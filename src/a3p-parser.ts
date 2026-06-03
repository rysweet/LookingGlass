export {
  parseA3P,
  parseA3PFromZip,
  readA3PXmlEntry,
} from "./a3p-parser/archive.js";
export { PARSED_A3P_STATEMENT_KINDS } from "./a3p-parser/statements.js";
export {
  DEFAULT_A3P_XML_ENTRY,
  LEGACY_A3P_XML_ENTRY,
  getA3PMethodSource,
  getA3PSource,
  snapshotAliceProject,
  snapshotAliceStatements,
  type A3PMethodSourceMetadata,
  type A3PSourceMetadata,
  type AliceFieldDefinition,
  type AliceMethod,
  type AliceObject,
  type AliceProject,
  type AliceStatement,
  type AliceTypeDefinition,
} from "./a3p-parser/types.js";
