import { X, User, FileText, Pencil, DollarSign } from "lucide-react";
import { channelColor, channelLabel, type Reservation } from "@/lib/mock/calendar";
import { OBadge } from "@/components/ui-oriya/Badge";

type Props = {
  reservation: Reservation;
  onClose: () => void;
};

export function ReservationPopover({ reservation, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="card-shadow w-[360px] rounded-xl border bg-white p-5"
        style={{ borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: channelColor[reservation.channel] }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{channelLabel[reservation.channel]}</span>
            </div>
            <h3 className="mt-1 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{reservation.guest}</h3>
            {reservation.phone && (
              <div className="ltr-num mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>{reservation.phone}</div>
            )}
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-[var(--bg-subtle)]" aria-label="סגור">
            <X size={16} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 text-sm">
          <Row label="לילות" value={<span className="ltr-num">{reservation.length}</span>} />
          <Row
            label="סטטוס"
            value={
              <select
                className="rounded-md border px-2 py-1 text-xs"
                style={{ borderColor: "var(--border)", backgroundColor: "#fff" }}
                defaultValue="confirmed"
              >
                <option value="pending">מוזמן</option>
                <option value="confirmed">מאושר</option>
                <option value="checkin">צ'ק-אין</option>
                <option value="checkout">צ'ק-אאוט</option>
              </select>
            }
          />
          <Row label="תשלום" value={<OBadge tone="success">מקדמה שולמה</OBadge>} />
        </div>

        <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex gap-1">
            <IconBtn label="פרופיל"><User size={15} /></IconBtn>
            <IconBtn label="טופס הורים"><FileText size={15} /></IconBtn>
            <IconBtn label="עריכה"><Pencil size={15} /></IconBtn>
            <IconBtn label="תשלום"><DollarSign size={15} /></IconBtn>
          </div>
          <button
            className="rounded-[10px] px-3 py-1.5 text-xs font-medium text-white"
            style={{ backgroundColor: "var(--navy-700)" }}
          >
            פתח הזמנה
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
    <button
      className="rounded-lg p-2 hover:bg-[var(--bg-subtle)]"
      title={label}
      aria-label={label}
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </button>
  );
}