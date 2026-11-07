<template>
  <RouterView />
</template>

<style>
:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #172235;
  background: #f3f6fa;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-optical-sizing: auto;
  font-weight: 400;

  --ink: #172235;
  --muted: #657187;
  --line: #e5eaf1;
  --accent: #315be8;
  --accent-dark: #2246c5;
  --surface: #fff;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
}

.page-shell {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 48px 0 64px;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.page-title {
  margin: 0;
  color: var(--ink);
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: 760;
  letter-spacing: -0.055em;
  line-height: 1.05;
}

.page-description {
  margin: 12px 0 0;
  color: var(--muted);
  line-height: 1.6;
}

.notice {
  margin: 24px 0;
  padding: 14px 16px;
  border: 1px solid #f1c7c2;
  border-radius: 12px;
  color: #8c3028;
  background: #fff7f6;
}

.notice--success {
  border-color: #bce6cf;
  color: #17653b;
  background: #f2fbf6;
}

.notice--info {
  border-color: #c8d6ff;
  color: #2949a6;
  background: #f4f7ff;
}

.primary-button {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 20px;
  border: 0;
  border-radius: 12px;
  color: white;
  background: var(--accent);
  font-weight: 700;
  transition:
    background 150ms ease,
    transform 150ms ease;
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--accent-dark);
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.text-link {
  color: var(--accent);
  font-size: 0.9rem;
  font-weight: 650;
  text-decoration: none;
}

.text-link:hover {
  text-decoration: underline;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  color: #354156;
  font-size: 0.88rem;
  font-weight: 650;
}

.field-control {
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid #dce3ed;
  border-radius: 10px;
  outline: none;
  color: var(--ink);
  background: white;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.field-control:focus {
  border-color: #8098f4;
  box-shadow: 0 0 0 3px rgb(49 91 232 / 12%);
}

@media (max-width: 600px) {
  .page-shell {
    width: min(100% - 28px, 1120px);
    padding: 32px 0 44px;
  }
}
</style>
