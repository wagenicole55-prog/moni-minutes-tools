:root {
  --bg: #08121f;
  --bg-soft: #101a2c;
  --panel: rgba(16, 25, 42, 0.92);
  --panel-strong: rgba(20, 34, 56, 0.96);
  --line: rgba(148, 163, 184, 0.2);
  --line-soft: rgba(148, 163, 184, 0.12);
  --text: #ebf3ff;
  --muted: #a8b9d6;
  --cyan: #4ac5ff;
  --blue: #5a7cff;
  --violet: #7c6cff;
  --green: #2ad6a3;
  --green-soft: rgba(42, 214, 163, 0.14);
  --amber: #f3bf5b;
  --amber-soft: rgba(243, 191, 91, 0.12);
  --red: #f4667a;
  --red-soft: rgba(244, 102, 122, 0.13);
  --shadow: 0 14px 32px rgba(0, 0, 0, 0.28);
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  min-height: 100%;
  font-family: Inter, 'Segoe UI', sans-serif;
  background: linear-gradient(180deg, #071420 0%, #091b2d 100%);
  color: var(--text);
}

button, input, select {
  font: inherit;
}

body {
  min-height: 100vh;
}

.auth-body {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px;
}

.auth-shell {
  width: min(1150px, 100%);
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  min-height: 720px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: rgba(9, 18, 30, 0.8);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.auth-panel {
  padding: 42px;
}

.left-panel {
  background: radial-gradient(circle at top left, rgba(90,124,255,0.26), transparent 30%), 
    linear-gradient(180deg, rgba(12, 25, 40, 0.68), rgba(10, 17, 27, 0.92));
  border-right: 1px solid var(--line);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 34px;
}

.brand-mark {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--cyan), var(--violet));
  color: #040d18;
  font-weight: 800;
  font-size: 1.4rem;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.eyebrow.accent {
  color: var(--cyan);
}

.brand-block h1,
.auth-card h2,
.topbar h2 {
  margin: 0;
}

.left-panel h1 {
  font-size: clamp(2.2rem, 3vw, 3.2rem);
  line-height: 1.1;
}

.feature-list {
  display: grid;
  gap: 18px;
  margin-top: 38px;
}

.feature-item {
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
  border-radius: 16px;
  padding: 18px 18px;
  display: grid;
  gap: 8px;
}

.feature-item strong {
  font-size: 1.1rem;
}

.feature-item span {
  color: var(--muted);
  line-height: 1.5;
}

.right-panel {
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: min(100%, 440px);
  background: rgba(14, 23, 38, 0.9);
  border: 1px solid var(--line);
  border-radius: 26px;
  padding: 28px;
  box-shadow: var(--shadow);
}

.auth-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 12px;
  margin: 22px 0 20px;
  overflow: hidden;
}

.toggle-btn {
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 12px 20px;
  cursor: pointer;
  font-weight: 700;
}

.toggle-btn.active {
  background: linear-gradient(135deg, rgba(90,124,255,0.2), rgba(76,197,255,0.1));
  color: var(--text);
}

form {
  display: grid;
  gap: 14px;
}

label {
  display: grid;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--muted);
}

.field-grid {
  display: grid;
  gap: 14px;
}

.field-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

input, select {
  width: 100%;
  background: rgba(4, 10, 18, 0.8);
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--text);
  padding: 12px 14px;
}

.primary-btn {
  border: 0;
  cursor: pointer;
  border-radius: 12px;
  padding: 12px 18px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--cyan), var(--violet));
  color: #041420;
}

.wide {
  width: 100%;
}

.hidden {
  display: none !important;
}

.demo-box {
  margin-top: 18px;
  border: 1px solid var(--line-soft);
  background: rgba(255,255,255,0.02);
  border-radius: 12px;
  padding: 14px 16px;
}

.demo-box p {
  margin: 0 0 8px;
  color: var(--muted);
  font-weight: 700;
}

.demo-box ul {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.7;
}

.app-body {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: rgba(7, 15, 28, 0.9);
  border-right: 1px solid var(--line);
  padding: 24px 18px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.sidebar-brand h3 {
  margin: 0;
}

.sidebar-brand small {
  color: var(--muted);
}

.side-nav {
  display: grid;
  gap: 8px;
}

.side-nav a {
  color: var(--muted);
  text-decoration: none;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
}

.side-nav a.active,
.side-nav a:hover {
  background: rgba(90,124,255,0.13);
  color: var(--text);
  border-color: rgba(90,124,255,0.14);
}

.main-panel {
  flex: 1;
  padding: 28px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.user-pill {
  background: rgba(90,124,255,0.12);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 10px 14px;
  color: var(--text);
  font-size: 0.82rem;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(180px, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.metric-card {
  background: linear-gradient(180deg, rgba(16, 26, 44, 0.9), rgba(11, 19, 34, 0.94));
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  box-shadow: var(--shadow);
}

.metric-card .label {
  display: block;
  margin-bottom: 14px;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.metric-card .value {
  font-size: clamp(1.7rem, 2vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.06em;
}

.metric-card .meta {
  margin-top: 8px;
  color: var(--muted);
  font-size: 0.8rem;
}

.metric-card.green { border-color: rgba(42,214,163,0.22); }
.metric-card.amber { border-color: rgba(243,191,91,0.2); }
.metric-card.red { border-color: rgba(244,102,122,0.2); }
.metric-card.blue { border-color: rgba(90,124,255,0.2); }

.content-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 22px;
  margin-bottom: 22px;
}

.panel {
  background: rgba(17, 27, 43, 0.9);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 18px;
  box-shadow: var(--shadow);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.account-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.account-item {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  padding: 16px;
}

.account-item .title {
  display: block;
  font-weight: 700;
  margin-bottom: 8px;
}

.account-item .small {
  color: var(--muted);
  font-size: 0.78rem;
}

.account-item .balance {
  margin-top: 14px;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.05em;
}

.stack-form {
  display: grid;
  gap: 14px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: middle;
}

th {
  color: var(--muted);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.status-pending {
  background: var(--amber-soft);
  color: var(--amber);
}

.status-settled {
  background: var(--green-soft);
  color: var(--green);
}

.status-failed {
  background: var(--red-soft);
  color: var(--red);
}

.action-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.small-btn {
  border: 0;
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  font-weight: 700;
}

.small-btn.approve {
  background: var(--green-soft);
  color: var(--green);
}

.small-btn.reject {
  background: var(--red-soft);
  color: var(--red);
}

.full-width-panel {
  margin-top: 10px;
}

.empty-state {
  color: var(--muted);
  padding: 18px 0;
}

@media (max-width: 1024px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .left-panel {
    border-right: none;
    border-bottom: 1px solid var(--line);
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .app-body {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--line);
  }

  .metrics-row {
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  }

  .field-grid.two {
    grid-template-columns: 1fr;
  }
}
