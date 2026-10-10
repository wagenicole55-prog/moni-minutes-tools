:root {
  --bg: #0b1020;
  --bg-soft: #101a2d;
  --panel: #121f36;
  --panel-2: #1a2a47;
  --line: rgba(255, 255, 255, 0.08);
  --text: #edf5ff;
  --muted: #9ab0d1;
  --green: #27c58f;
  --green-soft: rgba(39, 197, 143, 0.12);
  --amber: #f4b942;
  --amber-soft: rgba(244, 185, 66, 0.14);
  --red: #f26c6c;
  --red-soft: rgba(242, 108, 108, 0.14);
  --blue: #5ca7ff;
  --shadow: 0 18px 40px rgba(2, 6, 23, 0.35);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: Inter, Arial, sans-serif;
  background: linear-gradient(180deg, #0a1020 0%, #0d1429 100%);
  color: var(--text);
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background: rgba(10, 18, 31, 0.9);
  border-right: 1px solid var(--line);
  padding: 28px 20px;
}

.brand-box {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #34d399, #60a5fa);
  display: grid;
  place-items: center;
  color: #07111a;
  font-weight: 800;
}

.brand-box h1 {
  margin: 0;
  font-size: 1.2rem;
}

.brand-box small {
  color: var(--muted);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 22px;
}

.nav a {
  text-decoration: none;
  color: var(--muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 12px 14px;
  transition: 0.2s ease;
}

.nav a.active,
.nav a:hover {
  background: rgba(92, 167, 255, 0.08);
  border-color: rgba(92, 167, 255, 0.2);
  color: var(--text);
}

.content {
  flex: 1;
  padding: 28px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 0.74rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.topbar h2 {
  margin: 0;
  font-size: clamp(1.7rem, 2vw, 2.4rem);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(5, minmax(180px, 1fr));
  gap: 18px;
  margin-bottom: 28px;
}

.card {
  background: linear-gradient(180deg, rgba(18, 31, 54, 0.96), rgba(13, 22, 38, 0.9));
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  box-shadow: var(--shadow);
}

.card .label {
  display: block;
  margin-bottom: 16px;
  color: var(--muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.card .value {
  font-size: clamp(1.5rem, 2vw, 2.3rem);
  font-weight: 700;
  letter-spacing: -0.05em;
}

.card .meta {
  margin-top: 8px;
  color: var(--muted);
  font-size: 0.84rem;
}

.card.green {
  border-color: rgba(39, 197, 143, 0.28);
}

.card.amber {
  border-color: rgba(244, 185, 66, 0.28);
}

.card.red {
  border-color: rgba(242, 108, 108, 0.28);
}

.panel {
  background: rgba(18, 31, 54, 0.85);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--shadow);
  margin-bottom: 24px;
}

.panel-header {
  margin-bottom: 18px;
}

.panel-header h3 {
  margin: 0;
}

.with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-btn {
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: var(--text);
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn.primary {
  background: linear-gradient(135deg, #5ca7ff, #7f5af0);
  border: none;
}

.account-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.account-item {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
}

.account-item .name {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

.account-item .meta {
  color: var(--muted);
  font-size: 0.82rem;
}

.balance {
  margin-top: 16px;
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: -0.05em;
}

.transaction-form {
  margin-bottom: 20px;
  padding: 18px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
  border-radius: 14px;
}

.hidden {
  display: none;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.field-row.single {
  grid-template-columns: 1fr;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--muted);
  font-size: 0.85rem;
}

input,
select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(9, 14, 25, 0.7);
  color: var(--text);
  padding: 12px 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.transaction-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 14px 10px;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
}

th {
  color: var(--muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

.btn-inline {
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
}

.btn-inline.approve {
  background: var(--green-soft);
  color: var(--green);
}

.btn-inline.reject {
  background: var(--red-soft);
  color: var(--red);
}

.empty-state {
  color: var(--muted);
  padding: 18px 0;
}

@media (max-width: 980px) {
  .app-shell {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--line);
  }

  .summary-cards {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}
