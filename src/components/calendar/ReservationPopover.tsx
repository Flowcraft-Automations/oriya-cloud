import { X, User, FileText, Pencil, DollarSign } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { channelColorVar as channelColor, channelLabel, statusLabel, type Channel, type Reservation, type ReservationStatus } from "@/lib/types";
import { OBadge } from "@/components/ui-oriya/Badge";
import { updateReservationStatus, deleteReservation } from "@/lib/data.functions";

type Props = {
  reservation: Reservation;
  onClose: () => void;
};

export function ReservationPopover({ reservation, onClose }: Props) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateReservationStatus);
  const deleteFn = useServerFn(deleteReservation);

  const update = useMutation({
    mutationFn: (status: ReservationStatus) => updateFn({ data: { id: reservation.id, status } }),
    onSuccess: () => qc.invalidateQueries(),
  });
  const del = useMutation({
    mutationFn: () => deleteFn({ data: { id: reservation.id } }),
    onSuccess: () => { qc.invalidateQueries(); onClose(); },
  });

  const paid = reservation.paid_amount >= reservation.total_amount && reservation.total_amount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="card-shadow w-[360px] rounded-xl border bg-white p-5"
        style={{ borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: channelColor[reservation.channel as Channel] }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{channelLabel[reservation.channel as Channel]}</span>
            </div>
            <h3 className="mt-1 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{reservation.guest_name}</h3>
            {reservation.phone && (
              <div className="ltr-num mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>{reservation.phone}</div>
            )}
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-[var(--bg-subtle)]" aria-label="סגור">
            <X size={16} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 text-sm">
          <Row label="לילות" value={<span className="ltr-num">{reservation.nights}</span>} />
          <Row label="תאריכים" value={<span className="ltr-num text-xs">{reservation.check_in} → {reservation.check_out}</span>} />
          <Row
            label="סטטוס"
            value={
              <select
                className="rounded-md border px-2 py-1 text-xs"
                style={{ borderColor: "var(--border)", backgroundColor: "#fff" }}
                value={reservation.status}
                onChange={(e) => update.mutate(e.target.value as ReservationStatus)}
                disabled={update.isPending}
              >
                {(Object.keys(statusLabel) as ReservationStatus[]).map((s) => (
                  <option key={s} value={s}>{statusLabel[s]}</option>
                ))}
              </select>
            }
          />
          <Row label="תשלום" value={
            <OBadge tone={paid ? "success" : "warning"}>
              ₪{reservation.paid_amount.toLocaleString()} / ₪{reservation.total_amount.toLocaleString()}
            </OBadge>
          } />
        </div>

        <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex gap-1">
            <IconBtn label="פרופיל"><User size={15} /></IconBtn>
            <IconBtn label="טופס הורים"><FileText size={15} /></IconBtn>
            <IconBtn label="עריכה"><Pencil size={15} /></IconBtn>
            <IconBtn label="תשלום"><DollarSign size={15} /></IconBtn>
          </div>
          <button
            onClick={() => { if (confirm("למחוק את ההזמנה?")) del.mutate(); }}
            className="rounded-[10px] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: "#b91c1c" }}
            disabled={del.isPending}
          >
            מחק
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function IconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button className="rounded-lg p-2 hover:bg-[var(--bg-subtle)]" title={label} aria-label={label} style={{ color: "var(--text-secondary)" }}>
      {children}
    </button>
  );
}
