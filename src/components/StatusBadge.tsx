type Status = "active" | "inactive" | "pending" | "completed" | "critical" | "in-stock" | "low-stock" | "out-of-stock" | "collected" | "not-collected" | "in-processing" | "rejected" | "urgent" | "stat" | "routine";

const statusStyles: Record<Status, string> = {
  active: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  "in-stock": "bg-success/10 text-success",
  collected: "bg-success/10 text-success",
  routine: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning",
  "low-stock": "bg-warning/10 text-warning",
  "in-processing": "bg-primary/10 text-primary",
  inactive: "bg-muted text-muted-foreground",
  "not-collected": "bg-muted text-muted-foreground",
  critical: "bg-destructive/10 text-destructive",
  "out-of-stock": "bg-destructive/10 text-destructive",
  rejected: "bg-destructive/10 text-destructive",
  urgent: "bg-warning/10 text-warning",
  stat: "bg-destructive/10 text-destructive",
};

const StatusBadge = ({ status }: { status: Status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[status]}`}>
    {status.replace("-", " ")}
  </span>
);

export default StatusBadge;
