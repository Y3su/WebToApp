CREATE FUNCTION app_current_organization_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.organization_id', true), '')::uuid
$$;
--> statement-breakpoint
DO $$
DECLARE tenant_table text;
BEGIN
  FOREACH tenant_table IN ARRAY ARRAY[
    'memberships', 'projects', 'domain_verifications', 'app_spec_revisions',
    'runners', 'builds', 'build_targets', 'artifacts', 'audit_events'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (organization_id = app_current_organization_id()) WITH CHECK (organization_id = app_current_organization_id())',
      tenant_table
    );
  END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON organizations
USING (id = app_current_organization_id()) WITH CHECK (id = app_current_organization_id());
--> statement-breakpoint
CREATE FUNCTION reject_revision_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'AppSpec revisions are immutable'; END $$;
CREATE TRIGGER immutable_app_spec_revision BEFORE UPDATE OR DELETE ON app_spec_revisions
FOR EACH ROW EXECUTE FUNCTION reject_revision_mutation();
--> statement-breakpoint
-- Composite references prevent same-tenant rows from linking to another tenant's parent.
ALTER TABLE projects ADD CONSTRAINT projects_id_org UNIQUE (id, organization_id);
ALTER TABLE app_spec_revisions ADD CONSTRAINT revisions_id_org UNIQUE (id, organization_id);
ALTER TABLE runners ADD CONSTRAINT runners_id_org UNIQUE (id, organization_id);
ALTER TABLE builds ADD CONSTRAINT builds_id_org UNIQUE (id, organization_id);
ALTER TABLE build_targets ADD CONSTRAINT targets_id_org UNIQUE (id, organization_id);
ALTER TABLE domain_verifications ADD FOREIGN KEY (project_id, organization_id) REFERENCES projects(id, organization_id);
ALTER TABLE app_spec_revisions ADD FOREIGN KEY (project_id, organization_id) REFERENCES projects(id, organization_id);
ALTER TABLE builds ADD FOREIGN KEY (project_id, organization_id) REFERENCES projects(id, organization_id);
ALTER TABLE builds ADD FOREIGN KEY (app_spec_revision_id, organization_id) REFERENCES app_spec_revisions(id, organization_id);
ALTER TABLE build_targets ADD FOREIGN KEY (build_id, organization_id) REFERENCES builds(id, organization_id);
ALTER TABLE build_targets ADD FOREIGN KEY (runner_id, organization_id) REFERENCES runners(id, organization_id);
ALTER TABLE artifacts ADD FOREIGN KEY (build_target_id, organization_id) REFERENCES build_targets(id, organization_id);
