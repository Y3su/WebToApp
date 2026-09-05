import schemaDocument from "./app-spec-v1.schema.json" with { type: "json" };

/** Draft 2020-12 schema used by every AppSpec producer and consumer. */
export const appSpecV1Schema: Readonly<Record<string, unknown>> =
  schemaDocument;

export const APP_SPEC_SCHEMA_ID = appSpecV1Schema.$id as string;
