import React, { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye, Pencil, Printer, Barcode as BarcodeIcon, SendHorizonal, Trash2,
  User, TestTubes, Droplets, FlaskConical, TestTube, ClipboardList,
  Thermometer, ThermometerSun, Snowflake, ChevronDown, ChevronRight,
} from "lucide-react";
import { type SampleRecord } from "@/data/sampleRecords";
import { printRecordReport, printBarcode } from "@/lib/printUtils";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

interface PatientGroup {
  patient: string;
  patientId: string;
  age: number;
  gender: string;
  records: SampleRecord[];
}

interface Props {
  data: SampleRecord[];
  onView: (r: SampleRecord) => void;
  onEdit: (r: SampleRecord) => void;
  onConfirm: (r: SampleRecord) => void;
  onDelete: (r: SampleRecord) => void;
  onBulkConfirm?: (records: SampleRecord[]) => void;
}

const sampleTypeIcons: Record<string, React.ElementType> = {
  blood: Droplets, urine: FlaskConical, stool: FlaskConical, sputum: FlaskConical,
  swab: TestTube, tissue: TestTube, csf: Droplets, other: ClipboardList,
};

const storageIcons: Record<string, React.ElementType> = {
  room: ThermometerSun, refrigerated: Thermometer, frozen: Snowflake,
};

function ActionButton({ icon: Icon, title, onClick, className = "" }: {
  icon: React.ElementType; title: string; onClick: () => void; className?: string;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className={`h-7 w-7 rounded-full ${className}`} onClick={onClick}>
            <Icon className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">{title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SampleGroupedTable({ data, onView, onEdit, onConfirm, onDelete, onBulkConfirm }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const groups: PatientGroup[] = [];
  const groupMap = new Map<string, PatientGroup>();

  data.forEach((r) => {
    const key = `${r.patient}__${r.patientId}`;
    if (!groupMap.has(key)) {
      const group: PatientGroup = {
        patient: r.patient, patientId: r.patientId,
        age: r.age, gender: r.gender, records: [],
      };
      groupMap.set(key, group);
      groups.push(group);
    }
    groupMap.get(key)!.records.push(r);
  });

  const handlePrint = (r: SampleRecord) => {
    printRecordReport({
      id: r.id, sectionTitle: "Sample Collection Report",
      fields: [
        { label: "Patient", value: r.patient }, { label: "Patient ID", value: r.patientId },
        { label: "Test", value: r.testName }, { label: "Sample Type", value: r.sampleType },
        { label: "Priority", value: r.priority }, { label: "Barcode", value: r.barcode },
        { label: "Collection Date", value: r.collectionDate },
        { label: "Collection Time", value: r.collectionTime || "N/A" },
        { label: "Storage", value: r.storageTemp },
        { label: "Collected By", value: r.collectedBy || "Unassigned" },
        { label: "Status", value: r.status }, { label: "Notes", value: r.notes || "—" },
      ],
    });
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/50">
        <TestTube className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-medium">No samples found</p>
        <p className="text-xs mt-1">Try adjusting your filters or add a new sample</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group, groupIdx) => {
        const groupKey = `${group.patient}__${group.patientId}`;
        const isCollapsed = collapsed.has(groupKey);
        const confirmable = group.records.filter(r => r.status === "pending" || r.status === "collected");
        const uniqueTests = [...new Map(group.records.map(r => [r.testName, r])).values()];
        const uniqueSampleTypes = [...new Map(group.records.map(r => [r.sampleType, r])).values()];

        const highestPriority = group.records.some(r => r.priority === "stat")
          ? "stat"
          : group.records.some(r => r.priority === "urgent")
            ? "urgent"
            : "routine";
        const borderColor = highestPriority === "stat"
          ? "border-l-destructive"
          : highestPriority === "urgent"
            ? "border-l-warning"
            : "border-l-success";

        return (
          <div
            key={`${group.patient}__${group.patientId}`}
            className={`rounded-xl border border-border border-l-4 ${borderColor} bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
          >
            {/* Patient Header */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border cursor-pointer select-none"
              onClick={() => toggleCollapse(groupKey)}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />}
                </div>
                </div>
                <div>
                  <div className="font-semibold text-card-foreground text-sm">{group.patient}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="font-mono">{group.patientId}</span>
                    <span>·</span>
                    <span>{group.age}y</span>
                    <span>·</span>
                    <span>{group.gender}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {group.records.length} {group.records.length === 1 ? "sample" : "samples"}
                </Badge>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {confirmable.length > 1 && onBulkConfirm && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 rounded-lg"
                    onClick={() => onBulkConfirm(confirmable)}
                  >
                    <SendHorizonal className="w-3.5 h-3.5" />
                    Send All ({confirmable.length})
                  </Button>
                )}
              </div>
            </div>

            {!isCollapsed && <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">ID</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Test</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Sample</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Priority</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Barcode</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Collected</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Storage</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Collector</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.records.map((r, idx) => {
                    const SampleIcon = sampleTypeIcons[r.sampleType] || TestTube;
                    const StorageIcon = storageIcons[r.storageTemp] || Thermometer;
                    const isLast = idx === group.records.length - 1;

                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-muted/20 transition-colors ${!isLast ? "border-b border-border/40" : ""}`}
                      >
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-medium"
                            onClick={() => onView(r)}
                          >
                            {r.testName}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <SampleIcon className="w-3.5 h-3.5 text-primary/70" />
                            <span className="capitalize text-xs">{r.sampleType}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={r.priority} />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-xs bg-muted/80 px-2 py-0.5 rounded-md">{r.barcode}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {r.collectionTime ? (
                            <div>
                              <div className="text-xs text-card-foreground">{r.collectionDate}</div>
                              <div className="text-[10px] text-muted-foreground">{r.collectionTime}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Not yet</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <StorageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="capitalize text-xs">{r.storageTemp}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs">{r.collectedBy || <span className="text-muted-foreground italic">Unassigned</span>}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={(r.status === "failed" ? "rejected" : r.status) as any} />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-0.5">
                            <ActionButton icon={Eye} title={`View ${r.testName}`} onClick={() => onView(r)} />
                            <ActionButton icon={Pencil} title={`Edit ${r.testName}`} onClick={() => onEdit(r)} />
                            <ActionButton icon={BarcodeIcon} title="Print Barcode" onClick={() => printBarcode(r.id, r.patient)} />
                            <ActionButton icon={Printer} title="Print Report" onClick={() => handlePrint(r)} className="text-primary" />
                            {(r.status === "pending" || r.status === "collected") && (
                              <ActionButton icon={SendHorizonal} title="Send to Lab" onClick={() => onConfirm(r)} className="text-primary" />
                            )}
                            <ActionButton icon={Trash2} title="Delete" onClick={() => onDelete(r)} className="text-destructive hover:text-destructive" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>}
          </div>
        );
      })}
    </div>
  );
}

export default SampleGroupedTable;
