"use client";

import { useState, type FormEvent } from "react";

export function SpecValidator({ example }: { example: string }) {
  const [document, setDocument] = useState(example);
  const [report, setReport] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/v1/app-spec/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: document,
      });
      const result: unknown = await response.json();
      setReport(JSON.stringify(result, null, 2));
    } catch {
      setReport("Validation is unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="validator-title">
      <p className="eyebrow">Developer preview</p>
      <h2 id="validator-title">Check your application specification.</h2>
      <p>
        Validate configuration and review policy findings. This preview does not
        save your document or create a build.
      </p>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <label htmlFor="app-spec">AppSpec JSON</label>
        <textarea
          id="app-spec"
          value={document}
          onChange={(event) => setDocument(event.target.value)}
          spellCheck={false}
          maxLength={262144}
          rows={16}
        />
        <button className="primary-action" disabled={busy} type="submit">
          {busy ? "Checking…" : "Validate specification"}
        </button>
      </form>
      <pre className="validation-report" role="status" aria-live="polite">
        {report}
      </pre>
    </section>
  );
}
