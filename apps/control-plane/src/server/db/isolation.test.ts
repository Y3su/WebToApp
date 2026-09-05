import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("applies migrations and fails closed across tenants, references, and immutable revisions", async () => {
  const db = new PGlite();
  try {
    for (const file of ["0000_foundation.sql", "0001_tenant_security.sql"]) {
      await db.exec(
        readFileSync(
          new URL("../../../drizzle/" + file, import.meta.url),
          "utf8",
        ),
      );
    }
    await db.exec(`
      CREATE ROLE wta_test;
      GRANT USAGE ON SCHEMA public TO wta_test;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO wta_test;
      INSERT INTO organizations(id,name,slug) VALUES
        ('00000000-0000-0000-0000-000000000001','One','one'),
        ('00000000-0000-0000-0000-000000000002','Two','two');
      INSERT INTO projects(id,organization_id,name,slug) VALUES
        ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','One','one'),
        ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','Two','two');
      SET ROLE wta_test;
    `);
    expect((await db.query("SELECT * FROM projects")).rows).toHaveLength(0);
    await db.exec(
      "SELECT set_config('app.organization_id','00000000-0000-0000-0000-000000000001',false)",
    );
    expect((await db.query("SELECT * FROM projects")).rows).toHaveLength(1);
    await expect(
      db.exec(`INSERT INTO projects(id,organization_id,name,slug) VALUES
      ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','Bad','bad')`),
    ).rejects.toThrow();
    await expect(
      db.exec(`INSERT INTO app_spec_revisions(id,organization_id,project_id,revision,digest,document) VALUES
      ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',
       '10000000-0000-0000-0000-000000000002',1,'digest','{}')`),
    ).rejects.toThrow();
    await db.exec(`INSERT INTO app_spec_revisions(id,organization_id,project_id,revision,digest,document) VALUES
      ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',
       '10000000-0000-0000-0000-000000000001',1,'digest','{}')`);
    await expect(
      db.exec("UPDATE app_spec_revisions SET digest='changed'"),
    ).rejects.toThrow("immutable");
  } finally {
    await db.close();
  }
}, 30_000);
