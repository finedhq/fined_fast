// Admin calls for WinterArc referral checks, people and winners
// (backend routes/winterarc_admin.py).
import { request } from "../../services/api";

const post = (path, body) =>
  request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });

export const getReferrals = () => request("/winterarc/admin/referrals");
export const decideReferral = (friendId, decision, reason) =>
  post("/winterarc/admin/referrals/decide", { friend_id: friendId, decision, reason: reason || null });

export const searchPeople = (q) => request(`/winterarc/admin/people?q=${encodeURIComponent(q)}`);
export const getPerson = (id) => request(`/winterarc/admin/people/${id}`);
export const grantPoints = (id, points, reason) => post(`/winterarc/admin/people/${id}/grant`, { points, reason });
export const giftReset = (id, reason) => post(`/winterarc/admin/people/${id}/gift-reset`, { reason });
export const disqualifyPerson = (id, reason) => post(`/winterarc/admin/people/${id}/disqualify`, { reason });
export const reinstatePerson = (id) => post(`/winterarc/admin/people/${id}/reinstate`);

export const getWinners = (week) => request(`/winterarc/admin/winners${week ? `?week=${week}` : ""}`);

export const when = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "";
