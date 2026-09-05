export {};
const status = document.querySelector<HTMLParagraphElement>("#status");

window.addEventListener("webtoapp://runtime-ready", () => {
  if (status) {
    status.textContent = "Application window opened.";
  }
});

window.addEventListener("webtoapp://runtime-error", (event) => {
  if (status) {
    const detail =
      event instanceof CustomEvent ? String(event.detail ?? "") : "";
    status.textContent =
      detail || "The application could not be opened safely.";
  }
});
