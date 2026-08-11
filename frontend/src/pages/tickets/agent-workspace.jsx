import { useEffect, useMemo, useRef, useState } from 'react';
import './agent-workspace.css';
import { useAuth } from "../../context/AuthContext.jsx";
import * as api from "../../lib/api.js";

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const RESOLUTION_CATEGORIES = ['Answered', 'Replaced', 'Refunded', 'No fault found'];

const FILTERS = [
  { key: 'MY_OPEN', label: 'My open tickets', test: (t) => t.status === 'IN_PROGRESS' },
  { key: 'HIGH', label: 'High priority', test: (t) => t.priority === 'HIGH' && t.status !== 'RESOLVED' },
  { key: 'ESCALATED', label: 'Escalated', test: (t) => t.status === 'ESCALATED' },
  { key: 'RESOLVED', label: 'Resolved', test: (t) => t.status === 'RESOLVED' },
];

const EMPTY_COPY = {
  MY_OPEN: { title: 'Queue clear', body: "You've worked through every open ticket. Nice pace." },
  HIGH: { title: 'No high-priority tickets', body: 'Nothing urgent is waiting on you right now.' },
  ESCALATED: { title: 'Nothing escalated', body: 'No tickets are waiting on senior support.' },
  RESOLVED: { title: 'Nothing resolved yet', body: 'Tickets you close will show up here.' },
};

function seedTickets() {
  return [
    {
      id: 't1',
      number: 'TKT-4812',
      subject: "VPN keeps disconnecting after last night's Windows update",
      customer: 'Youssef Adel',
      category: 'Network',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      age: '32m',
      body: "Since the forced update rolled out this morning my VPN client drops every few minutes with error 809. I've tried reconnecting and rebooting twice, still happening. I can't reach the shared drive at all right now.",
      activity: [
        { text: 'Auto-classified as HIGH priority by triage model', when: '32m ago', tone: 'accent' },
        { text: 'Assigned to Sara', when: '30m ago', tone: 'neutral' },
      ],
    },
    {
      id: 't2',
      number: 'TKT-4815',
      subject: "Docking station won't detect second monitor — pin looks bent",
      customer: 'Mona Kabeel',
      category: 'Hardware',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      age: '1h',
      body: 'My second monitor stopped working through the dock this morning. I looked at the DisplayPort connector and one of the pins looks bent inward. First monitor still works fine directly from my laptop.',
      activity: [
        { text: 'Auto-classified as MEDIUM priority by triage model', when: '1h ago', tone: 'accent' },
        { text: 'Assigned to Sara', when: '55m ago', tone: 'neutral' },
      ],
    },
    {
      id: 't3',
      number: 'TKT-4817',
      subject: 'Monitor flickers only on the HDMI input',
      customer: 'Karim Nabil',
      category: 'Hardware',
      priority: 'LOW',
      status: 'IN_PROGRESS',
      age: '2h',
      body: "The external monitor flickers on and off every couple of minutes, but only when it's plugged in over HDMI. Switching to the DisplayPort cable I had lying around fixed it, so it might just be the cable or that port.",
      activity: [
        { text: 'Auto-classified as LOW priority by triage model', when: '2h ago', tone: 'accent' },
        { text: 'Assigned to Sara', when: '2h ago', tone: 'neutral' },
      ],
    },
    {
      id: 't4',
      number: 'TKT-4790',
      subject: 'Customer requesting $650 refund for a damaged laptop bag',
      customer: 'Omar Reda',
      category: 'Billing',
      priority: 'HIGH',
      status: 'ESCALATED',
      age: '5h',
      escalationReason: 'Refund amount ($650) exceeds agent approval limit of $500 — needs senior sign-off before it can be processed.',
      activity: [
        { text: 'Auto-classified as HIGH priority by triage model', when: '5h ago', tone: 'accent' },
        { text: 'Assigned to Sara', when: '5h ago', tone: 'neutral' },
        { text: 'Escalated to senior support', when: '4h ago', tone: 'warn' },
      ],
    },
    {
      id: 't5',
      number: 'TKT-4778',
      subject: 'Outlook asks for password every few minutes',
      customer: 'Nourhan Sayed',
      category: 'Software',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      age: '1d',
      resolutionCategory: 'Answered',
      resolutionText: 'Cached credentials in Windows Credential Manager were stale after the domain password reset. Cleared the Outlook entries and had the customer re-enter the new password — prompts stopped.',
      resolvedBy: 'Sara',
      resolvedWhen: '1d ago',
      activity: [
        { text: 'Auto-classified as MEDIUM priority by triage model', when: '1d ago', tone: 'accent' },
        { text: 'Assigned to Sara', when: '1d ago', tone: 'neutral' },
        { text: 'Resolved as Answered by Sara', when: '23h ago', tone: 'ok' },
      ],
    },
    {
      id: 't6',
      number: 'TKT-4801',
      subject: "Can't log into the timesheet portal after password reset",
      customer: 'Hana Farouk',
      category: 'Account',
      priority: 'LOW',
      status: 'RESOLVED',
      age: '8h',
      resolutionCategory: 'No fault found',
      resolutionText: 'Portal login worked on retest — customer had autofill sending the old cached password. Cleared saved credentials in the browser and confirmed login with the new password.',
      resolvedBy: 'Sara',
      resolvedWhen: '6h ago',
      activity: [
        { text: 'Auto-classified as LOW priority by triage model', when: '8h ago', tone: 'accent' },
        { text: 'Assigned to Sara', when: '8h ago', tone: 'neutral' },
        { text: 'Resolved as No fault found by Sara', when: '6h ago', tone: 'ok' },
      ],
    },
  ];
}

function Chip({ tone, children }) {
  return <span className={`chip chip--${tone}`}>{children}</span>;
}

function priorityTone(priority) {
  if (priority === 'HIGH') return 'red';
  if (priority === 'MEDIUM') return 'yellow';
  return 'grey';
}

function statusTone(status) {
  if (status === 'RESOLVED') return 'green';
  if (status === 'ESCALATED') return 'yellow';
  return 'grey';
}

function statusLabel(status) {
  if (status === 'RESOLVED') return 'RESOLVED';
  if (status === 'ESCALATED') return 'ESCALATED';
  return 'IN PROGRESS';
}

function dotTone(tone) {
  if (tone === 'accent') return '#C63527';
  if (tone === 'ok') return '#31B456';
  if (tone === 'warn') return '#F8CE46';
  return '#78808A';
}

function EmptyState({ title, body }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10.5L8 14.5L16 5.5" stroke="#31B456" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="empty-state__title">{title}</div>
      <div className="empty-state__body">{body}</div>
    </div>
  );
}

function Logo() {
  return (
    <div className="aw-logo-plate">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="36" height="36" rx="8" fill="#C63527" />
        <path d="M11 21.5L17 27.5L29 13.5" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="aw-wordmark">ITWORX<sup>®</sup></span>
    </div>
  );
}

export default function AgentWorkspace() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('MY_OPEN');
  const [search, setSearch] = useState('');

  const [resolutionCategory, setResolutionCategory] = useState(null);
  const [notes, setNotes] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimeout = useRef(null);

  useEffect(() => {
    if (!token) return;
    api.listTickets(token, {}).then((page) => {
      setTickets(page.content);
      if (page.content.length > 0) setSelectedId(page.content[0].id);
    });
  }, [token]);

  const selected = tickets.find((t) => t.id === selectedId) || null;

  useEffect(() => {
    setResolutionCategory(null);
    setNotes('');
    setNoteOpen(false);
    setNoteText('');
    setEscalateOpen(false);
    setEscalateReason('');
  }, [selectedId]);

  function showToast(message) {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast(message);
    toastTimeout.current = setTimeout(() => setToast(null), 2600);
  }

  function patch(id, changes, activityEntry) {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...changes };
        if (activityEntry) next.activity = [activityEntry, ...t.activity];
        return next;
      })
    );
  }

  const counts = useMemo(() => {
    const c = {};
    FILTERS.forEach((f) => {
      c[f.key] = tickets.filter(f.test).length;
    });
    return c;
  }, [tickets]);

  const searchLower = search.trim().toLowerCase();
  const activeFilter = FILTERS.find((f) => f.key === filter);
  const visibleTickets = tickets.filter((t) => {
    if (!activeFilter.test(t)) return false;
    if (!searchLower) return true;
    return (
      t.number.toLowerCase().includes(searchLower) ||
      t.subject.toLowerCase().includes(searchLower) ||
      t.customer.toLowerCase().includes(searchLower)
    );
  });

  function handlePriorityChange(priority) {
    if (!selected || selected.priority === priority) return;
    patch(selected.id, { priority }, { text: `Priority changed to ${priority}`, when: 'just now', tone: 'neutral' });
    showToast(`Priority set to ${priority}`);
  }

  function handleSaveNote() {
    if (!selected || !noteText.trim()) return;
    patch(selected.id, {}, { text: `Internal note: ${noteText.trim()}`, when: 'just now', tone: 'neutral' });
    showToast('Internal note saved');
    setNoteText('');
    setNoteOpen(false);
  }

  async function handleEscalate() {
    if (!selected || !escalateReason.trim()) return;
    try {
      await api.escalateTicket(token, selected.id, escalateReason.trim());
      patch(
          selected.id,
          { status: 'ESCALATED', escalationReason: escalateReason.trim() },
          { text: 'Escalated to senior support', when: 'just now', tone: 'warn' }
      );
      showToast('Ticket escalated');
      setEscalateOpen(false);
      setEscalateReason('');
    } catch (err) {
      showToast('Failed to escalate: ' + err.message);
    }
  }

  async function handleAssign(agentId) {
    if (!selected) return;
    try {
      await api.assignTicket(token, selected.id, agentId);
      patch(
          selected.id,
          { status: 'IN_PROGRESS' },
          { text: 'Assigned', when: 'just now', tone: 'neutral' }
      );
      showToast('Ticket assigned');
    } catch (err) {
      showToast('Failed to assign: ' + err.message);
    }
  }

  function handleReopen() {
    if (!selected) return;
    patch(
      selected.id,
      {
        status: 'IN_PROGRESS',
        resolutionCategory: undefined,
        resolutionText: undefined,
        resolvedBy: undefined,
        resolvedWhen: undefined,
      },
      { text: 'Reopened by Sara', when: 'just now', tone: 'neutral' }
    );
    showToast('Ticket reopened');
  }

  function confirmResolve() {
    if (!selected) return;
    patch(
      selected.id,
      {
        status: 'RESOLVED',
        resolutionCategory: resolutionCategory || undefined,
        resolutionText: notes.trim() || undefined,
        resolvedBy: 'Sara',
        resolvedWhen: 'just now',
      },
      { text: `Resolved as ${resolutionCategory || 'no category'} by Sara`, when: 'just now', tone: 'ok' }
    );
    showToast('Ticket marked as done');
    setModalOpen(false);
  }

  const modalBody = useMemo(() => {
    if (!selected) return '';
    const firstName = selected.customer.split(' ')[0];
    if (resolutionCategory || notes.trim()) {
      const cat = (resolutionCategory || 'resolved').toLowerCase();
      return `This closes the ticket as ${cat} and notifies ${firstName}. You can reopen it afterwards.`;
    }
    return 'No resolution note was added. The ticket will close with an empty summary — fine for simple fixes, but harder to audit later.';
  }, [selected, resolutionCategory, notes]);

  return (
    <div className="agent-workspace">
      <header className="aw-header">
        <Logo />
        <div className="aw-product">
          <div className="aw-product__mark">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5L6.5 12L13 4.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="aw-product__text">
            <span className="aw-product__name">SupportDesk AI</span>
            <span className="aw-product__tag">AGENT WORKSPACE</span>
          </div>
        </div>
        <div className="aw-header__spacer" />
        <div className="aw-header__right">
          <span className="aw-timer">Session · 41m</span>
          <span className="aw-pill">Sara · AGENT</span>
          <button type="button" className="aw-ghost-btn">Sign out</button>
        </div>
      </header>

      <div className="aw-body">
        <aside className="aw-sidebar">
          <nav className="aw-nav-group">
            <div className="aw-nav-label">WORKSPACE</div>
            <div className="aw-nav-row">
              <span>Products</span>
              <span className="aw-nav-row__count">128</span>
            </div>
            <div className="aw-nav-row aw-nav-row--active">
              <span>Tickets</span>
              <span className="aw-nav-row__count">{tickets.length}</span>
            </div>
            <div className="aw-nav-row">
              <span>Orders</span>
              <span className="aw-nav-row__count">64</span>
            </div>
          </nav>

          <nav className="aw-nav-group">
            <div className="aw-nav-label">QUEUE</div>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`aw-filter-btn ${filter === f.key ? 'aw-filter-btn--active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                <span>{f.label}</span>
                <span className="aw-filter-btn__count">{counts[f.key]}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="aw-main">
          <div className="aw-stats">
            <div className="aw-stat">
              <div className="aw-stat__num" style={{ color: '#FFFFFF' }}>{counts.MY_OPEN}</div>
              <div className="aw-stat__label">MY OPEN</div>
            </div>
            <div className="aw-stat">
              <div className="aw-stat__num" style={{ color: '#C63527' }}>{counts.HIGH}</div>
              <div className="aw-stat__label">HIGH PRIORITY</div>
            </div>
            <div className="aw-stat">
              <div className="aw-stat__num" style={{ color: '#F8CE46' }}>{counts.ESCALATED}</div>
              <div className="aw-stat__label">ESCALATED</div>
            </div>
            <div className="aw-stat">
              <div className="aw-stat__num" style={{ color: '#31B456' }}>{counts.RESOLVED}</div>
              <div className="aw-stat__label">RESOLVED TODAY</div>
            </div>
            <div className="aw-stat aw-stat--last">
              <div className="aw-stat__num" style={{ color: '#D0D3D4' }}>4.2h</div>
              <div className="aw-stat__label">AVG RESOLUTION</div>
            </div>
          </div>

          <div className="aw-content">
            <section className="aw-list">
              <div className="aw-list__toolbar">
                <span className="aw-list__count">{visibleTickets.length} tickets</span>
                <input
                  type="text"
                  className="aw-search"
                  placeholder="Search tickets…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="aw-list__rows">
                {visibleTickets.length === 0 ? (
                  searchLower ? (
                    <EmptyState title="No match" body={`Nothing matches "${search.trim()}"`} />
                  ) : (
                    <EmptyState title={EMPTY_COPY[filter].title} body={EMPTY_COPY[filter].body} />
                  )
                ) : (
                  visibleTickets.map((t) => (
                    <div
                      key={t.id}
                      className={`ticket-row ${t.id === selectedId ? 'ticket-row--selected' : ''}`}
                      onClick={() => setSelectedId(t.id)}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedId(t.id);
                      }}
                    >
                      <div className="ticket-row__line1">
                        <span className="ticket-row__number">{t.number}</span>
                        <Chip tone={priorityTone(t.priority)}>{t.priority}</Chip>
                        <Chip tone={statusTone(t.status)}>{statusLabel(t.status)}</Chip>
                        <span className="ticket-row__age">{t.age}</span>
                      </div>
                      <div
                        className="ticket-row__subject"
                        style={t.status === 'RESOLVED' ? { color: '#78808A' } : undefined}
                      >
                        {t.subject}
                      </div>
                      <div className="ticket-row__meta">{t.customer} · {t.category}</div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="aw-detail">
              {selected && (
                <>
                  <div className="aw-detail__block">
                    <div className="aw-detail__top-row">
                      <span className="ticket-row__number">{selected.number}</span>
                      <Chip tone={statusTone(selected.status)}>{statusLabel(selected.status)}</Chip>
                    </div>
                    <h1 className="aw-detail__subject">{selected.subject}</h1>
                    <div className="aw-detail__meta">
                      {selected.customer} · opened {selected.age} ago · assigned to Sara
                    </div>
                    <div className="aw-detail__message">{selected.body}</div>
                  </div>

                  {selected.status === 'IN_PROGRESS' && (
                    <div className="aw-detail__block">
                      <div className="aw-field-label">PRIORITY</div>
                      <div className="pill-row">
                        {PRIORITIES.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`priority-pill priority-pill--${p.toLowerCase()} ${selected.priority === p ? 'priority-pill--selected' : ''}`}
                            onClick={() => handlePriorityChange(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <div className="aw-detail__subblock">
                        <div className="aw-heading-row">
                          <span className="aw-heading-row__title">Mark this ticket done</span>
                          <span className="aw-heading-row__hint">notes optional</span>
                        </div>

                        <div className="aw-field-label">RESOLUTION CATEGORY</div>
                        <div className="pill-row">
                          {RESOLUTION_CATEGORIES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`toggle-pill ${resolutionCategory === c ? 'toggle-pill--selected' : ''}`}
                              onClick={() => setResolutionCategory(resolutionCategory === c ? null : c)}
                            >
                              {c}
                            </button>
                          ))}
                        </div>

                        <textarea
                          className="aw-textarea"
                          rows={4}
                          placeholder="What did you do to resolve it? (optional)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />

                        <button type="button" className="aw-primary-btn" onClick={() => setModalOpen(true)}>
                          Mark as done
                        </button>

                        <div className="aw-split-row">
                          <button
                            type="button"
                            className="aw-secondary-btn"
                            onClick={() => {
                              setNoteOpen((v) => !v);
                              if (!noteOpen) setEscalateOpen(false);
                            }}
                          >
                            Internal note
                          </button>
                          <button
                              type="button"
                              className="aw-secondary-btn"
                              onClick={() => handleAssign(selected.assignedAgentId || "8b418494-de8a-46fb-b462-0aa505d8bfd1")}
                          >
                            Assign to me
                          </button>
                          <button
                            type="button"
                            className="aw-warn-outline-btn"
                            onClick={() => {
                              setEscalateOpen((v) => !v);
                              if (!escalateOpen) setNoteOpen(false);
                            }}
                          >
                            Escalate
                          </button>
                        </div>

                        {noteOpen && (
                          <div className="aw-disclosure">
                            <textarea
                              className="aw-textarea"
                              rows={3}
                              placeholder="Internal note — visible to agents only"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                            />
                            <button type="button" className="aw-secondary-btn aw-secondary-btn--full" onClick={handleSaveNote}>
                              Save note
                            </button>
                          </div>
                        )}

                        {escalateOpen && (
                          <div className="aw-disclosure">
                            <textarea
                              className="aw-textarea aw-textarea--warn"
                              rows={3}
                              placeholder="Reason for escalation — required"
                              value={escalateReason}
                              onChange={(e) => setEscalateReason(e.target.value)}
                            />
                            <button
                              type="button"
                              className="aw-warn-btn"
                              disabled={!escalateReason.trim()}
                              onClick={handleEscalate}
                            >
                              Escalate ticket
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selected.status === 'RESOLVED' && (
                    <div className="aw-detail__block">
                      <div className="resolved-block">
                        <div className="resolved-block__title">✓ Resolved by {selected.resolvedBy} · {selected.resolvedWhen}</div>
                        {selected.resolutionCategory && (
                          <div className="resolved-block__category">{selected.resolutionCategory}</div>
                        )}
                        {selected.resolutionText && <div className="resolved-block__note">{selected.resolutionText}</div>}
                      </div>
                      <button type="button" className="aw-ghost-btn aw-ghost-btn--block" onClick={handleReopen}>
                        Reopen ticket
                      </button>
                    </div>
                  )}

                  {selected.status === 'ESCALATED' && (
                    <div className="aw-detail__block">
                      <div className="escalated-block">
                        <div className="escalated-block__title">▲ Escalated to senior support</div>
                        <div className="escalated-block__reason">{selected.escalationReason}</div>
                      </div>
                    </div>
                  )}

                  <div className="aw-detail__block">
                    <div className="aw-field-label">ACTIVITY</div>
                    <div className="activity-list">
                      {selected.activity.map((entry, i) => (
                        <div className="activity-item" key={i}>
                          <span className="activity-item__dot" style={{ background: dotTone(entry.tone) }} />
                          <div className="activity-item__text">
                            <div className="activity-item__line">{entry.text}</div>
                            <div className="activity-item__when">{entry.when}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>

      {modalOpen && selected && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-panel__title">Mark {selected.number} as done?</h2>
            <p className="modal-panel__body">{modalBody}</p>
            <div className="modal-panel__actions">
              <button type="button" className="aw-ghost-btn" onClick={() => setModalOpen(false)}>
                Keep working
              </button>
              <button type="button" className="aw-primary-btn aw-primary-btn--auto" onClick={confirmResolve}>
                Yes, mark done
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
