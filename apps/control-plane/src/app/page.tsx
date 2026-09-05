import example from "../../../../packages/app-spec/examples/url-app.json";
import { SpecValidator } from "./spec-validator";

const targets = ["Android", "iOS", "Windows", "macOS", "Linux"];

export default function HomePage() {
  return (
    <main>
      <nav aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="WebToApp home">
          <span aria-hidden="true">W</span>
          WebToApp
        </a>
        <a className="secondary-link" href="https://github.com/Y3su/WebToApp">
          View source
        </a>
      </nav>

      <section id="top" className="hero">
        <p className="eyebrow">Open-source developer preview</p>
        <h1>Ship your web application everywhere.</h1>
        <p className="lede">
          Analyze compatibility, configure native value, and build auditable
          applications while your signing keys stay on your own runner.
        </p>
        <div className="actions">
          <a className="primary-action" href="/v1/health">
            Check API
          </a>
          <a
            className="text-action"
            href="https://github.com/Y3su/WebToApp#readme"
          >
            Read the architecture
          </a>
        </div>
      </section>

      <SpecValidator example={JSON.stringify(example, null, 2)} />

      <section className="targets" aria-labelledby="targets-heading">
        <div>
          <p className="eyebrow">Planned production targets</p>
          <h2 id="targets-heading">A deliberate runtime for every platform.</h2>
        </div>
        <ul>
          {targets.map((target) => (
            <li key={target}>{target}</li>
          ))}
        </ul>
      </section>

      <section className="principles" aria-labelledby="principles-heading">
        <p className="eyebrow">Built around trust</p>
        <h2 id="principles-heading">
          No anonymous cloning. No hidden signing custody.
        </h2>
        <div className="cards">
          <article>
            <span>01</span>
            <h3>Verify ownership</h3>
            <p>
              Release builds are limited to domains and content you control.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Know before building</h3>
            <p>
              Compatibility and store-readiness checks identify blockers early.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Keep your identity</h3>
            <p>
              Signing credentials remain on your customer-controlled runner.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
