"use client";

import { useState } from "react";

type ProgramInfo = { pointsName: string; earnRate: number; currency: string };

type MemberResult = {
  type: "member";
  membership: { id: string; points: number; userName: string; tier: string };
};

type CouponResult = {
  type: "coupon";
  coupon: {
    id: string;
    code: string;
    status: string;
    rewardTitle: string | null;
    expiresAt: string | null;
    memberEmail: string;
  };
};

const TABS = [
  { key: "checkin", label: "Check in" },
  { key: "batch", label: "Load sales" },
  { key: "redeem", label: "Redeem coupon" },
  { key: "balance", label: "Member balance" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function CounterPanel({
  businessId,
  businessName,
  program,
}: {
  businessId: string;
  businessName: string;
  program: ProgramInfo;
}) {
  const [tab, setTab] = useState<TabKey>("checkin");
  const [error, setError] = useState("");

  // check-in tab state
  const [memberCode, setMemberCode] = useState("");
  const [spend, setSpend] = useState("");
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [checkinResult, setCheckinResult] = useState<{ delta: number; points: number } | null>(null);

  // coupon tab state
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponResult["coupon"] | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState("");

  // balance tab state
  const [balanceCode, setBalanceCode] = useState("");
  const [balanceBusy, setBalanceBusy] = useState(false);
  const [balance, setBalance] = useState<MemberResult["membership"] | null>(null);
  // batch tab state
  const [batchText, setBatchText] = useState("");
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    successCount: number;
    total: number;
    results: Array<{ code: string; ok: boolean; error?: string; delta?: number; points?: number; member?: string }>;
  } | null>(null);

  async function call(path: string, body?: unknown): Promise<Record<string, unknown> | null> {
    const res = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Something went wrong");
      return null;
    }
    setError("");
    return data;
  }

  async function submitCheckin(e: React.FormEvent) {
    e.preventDefault();
    setCheckinResult(null);
    const code = memberCode.trim();
    const spendNum = parseFloat(spend);
    if (!code) return setError("Enter the member referral code");
    if (!Number.isFinite(spendNum) || spendNum < 0) return setError("Enter a valid spend amount");

    setCheckinBusy(true);
    const lookup = await call(`/api/biz/${businessId}/lookup?code=${encodeURIComponent(code)}`);
    if (lookup) {
      if (lookup.type !== "member") {
        setError("Not found");
      } else {
        const res = await call(`/api/biz/${businessId}/checkin`, { membershipId: (lookup as MemberResult).membership.id, spend: spendNum });
        if (res) setCheckinResult({ delta: res.delta as number, points: res.points as number });
      }
    }
    setCheckinBusy(false);
  }

  async function lookupCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCoupon(null);
    setCouponMsg("");
    const code = couponCode.trim();
    if (!code) return setError("Enter a coupon code");

    setCouponBusy(true);
    const lookup = await call(`/api/biz/${businessId}/lookup?code=${encodeURIComponent(code)}`);
    if (lookup) {
      if (lookup.type !== "coupon") {
        setError("Not found");
      } else {
        setCoupon((lookup as CouponResult).coupon);
      }
    }
    setCouponBusy(false);
  }

  async function markRedeemed() {
    if (!coupon) return;
    setCouponBusy(true);
    const res = await call(`/api/biz/${businessId}/coupons/redeem`, { code: coupon.code });
    if (res) {
      setCoupon({ ...coupon, status: "REDEEMED", redeemedAt: new Date().toISOString() } as CouponResult["coupon"]);
      setCouponMsg("Coupon marked as redeemed");
    }
    setCouponBusy(false);
  }

  async function lookupBalance(e: React.FormEvent) {
    e.preventDefault();
    setBalance(null);
    const code = balanceCode.trim();
    if (!code) return setError("Enter the member referral code");

    setBalanceBusy(true);
    const lookup = await call(`/api/biz/${businessId}/lookup?code=${encodeURIComponent(code)}`);
    if (lookup) {
      if (lookup.type !== "member") {
        setError("Not found");
      } else {
        setBalance((lookup as MemberResult).membership);
      }
    }
    setBalanceBusy(false);
  }

  async function submitBatch(e: React.FormEvent) {
    e.preventDefault();
    setBatchResult(null);
    setError("");
    const lines = batchText.trim().split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setError("Paste at least one line: code,spend");
      return;
    }
    const entries: Array<{ code: string; spend: number }> = [];
    for (const line of lines) {
      const parts = line.split(/[,\t]/).map((s) => s.trim());
      if (parts.length < 2) {
        setError(`Invalid line: "${line}" — use format: code,spend`);
        return;
      }
      const code = parts[0];
      const spend = parseFloat(parts[1]);
      if (!code || !Number.isFinite(spend) || spend < 0) {
        setError(`Invalid line: "${line}" — check code and spend`);
        return;
      }
      entries.push({ code, spend });
    }
    setBatchBusy(true);
    const res = await call(`/api/biz/${businessId}/checkin/batch`, { entries });
    if (res) {
      setBatchResult(res as typeof batchResult);
    }
    setBatchBusy(false);
  }

  function clearFeedback() {
    setError("");
    setCheckinResult(null);
    setCouponMsg("");
    setBatchResult(null);
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>{businessName} — Counter</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? "" : "secondary"}
            onClick={() => {
              setTab(t.key);
              clearFeedback();
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "checkin" && (
        <div className="card">
          <h2>Check in a member</h2>
          <form onSubmit={submitCheckin}>
            <label htmlFor="checkin-code">Member referral code</label>
            <input
              id="checkin-code"
              className="mono"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
              placeholder="paste referral code"
              style={{ width: "100%" }}
            />
            <label htmlFor="checkin-spend">Spend amount ({program.currency})</label>
            <input
              id="checkin-spend"
              type="number"
              step="0.01"
              min="0"
              value={spend}
              onChange={(e) => setSpend(e.target.value)}
              placeholder="0.00"
              style={{ width: "100%" }}
            />
            <div style={{ marginTop: 12 }}>
              <button type="submit" disabled={checkinBusy}>
                {checkinBusy ? "Recording…" : "Record check-in"}
              </button>
            </div>
          </form>
          {error && <p className="error-text">{error}</p>}
          {checkinResult && (
            <div className="points-hero" style={{ background: "var(--brand)", borderRadius: 10, padding: 16, marginTop: 12 }}>
              <div className="value">+{checkinResult.delta} {program.pointsName}</div>
              <div className="label">New balance: {checkinResult.points} {program.pointsName}</div>
            </div>
          )}
        </div>
      )}

      {tab === "batch" && (
        <div className="card">
          <h2>Load sales (bulk check-in)</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
            Paste multiple member codes and spend amounts — one per line, separated by a comma or tab.
            Each line awards {program.pointsName} instantly.
          </p>
          <form onSubmit={submitBatch}>
            <label htmlFor="batch-text">Member code, spend ({program.currency}) — one per line</label>
            <textarea
              id="batch-text"
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={"abc123,12.50\ndef456,8.00\nghi789,3.25"}
              rows={8}
              style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, resize: "vertical" }}
            />
            <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <button type="submit" disabled={batchBusy}>
                {batchBusy ? "Processing…" : `Process ${batchText.trim().split(/\n/).filter(Boolean).length || 0} check-ins`}
              </button>
              {batchResult && (
                <span className={`badge ${batchResult.successCount === batchResult.total ? "good" : "warn"}`}>
                  {batchResult.successCount}/{batchResult.total} succeeded
                </span>
              )}
            </div>
          </form>
          {error && <p className="error-text">{error}</p>}
          {batchResult && batchResult.results.length > 0 && (
            <table style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Member</th>
                  <th>Points</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {batchResult.results.map((r, i) => (
                  <tr key={i}>
                    <td><code className="mono">{r.code}</code></td>
                    <td>{r.member ?? "—"}</td>
                    <td>{r.ok ? `+${r.delta} → ${r.points} ${program.pointsName}` : "—"}</td>
                    <td>
                      {r.ok ? (
                        <span className="badge good">OK</span>
                      ) : (
                        <span className="badge bad">{r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "redeem" && (
        <div className="card">
          <h2>Redeem a coupon</h2>
          <form onSubmit={lookupCoupon}>
            <label htmlFor="coupon-code">Coupon code</label>
            <input
              id="coupon-code"
              className="mono"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="paste coupon code"
              style={{ width: "100%" }}
            />
            <div style={{ marginTop: 12 }}>
              <button type="submit" disabled={couponBusy}>Look up</button>
            </div>
          </form>
          {error && <p className="error-text">{error}</p>}
          {couponMsg && <p className="success-text">{couponMsg}</p>}
          {coupon && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: "8px 0" }}>
                <code className="mono">{coupon.code}</code>{" "}
                <span className={`badge ${coupon.status === "ACTIVE" ? "good" : "muted"}`}>
                  {coupon.status === "ACTIVE" ? "ACTIVE" : coupon.status === "REDEEMED" ? "REDEEMED" : "EXPIRED"}
                </span>
              </p>
              <p>Reward: {coupon.rewardTitle ?? "—"}</p>
              <p>Member: {coupon.memberEmail}</p>
              <p>Expires: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "Never"}</p>
              {coupon.status === "ACTIVE" && (
                <button className="danger" onClick={markRedeemed} disabled={couponBusy}>
                  Mark redeemed
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "balance" && (
        <div className="card">
          <h2>Member balance</h2>
          <form onSubmit={lookupBalance}>
            <label htmlFor="balance-code">Member referral code</label>
            <input
              id="balance-code"
              className="mono"
              value={balanceCode}
              onChange={(e) => setBalanceCode(e.target.value)}
              placeholder="paste referral code"
              style={{ width: "100%" }}
            />
            <div style={{ marginTop: 12 }}>
              <button type="submit" disabled={balanceBusy}>Look up</button>
            </div>
          </form>
          {error && <p className="error-text">{error}</p>}
          {balance && (
            <div style={{ marginTop: 12 }}>
              <div className="stat">
                <div className="value">{balance.points} {program.pointsName}</div>
                <div className="label">Tier: {balance.tier}</div>
              </div>
              <p style={{ marginTop: 8 }}>Member: {balance.userName}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
