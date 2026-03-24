import React from "react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye, Pencil, Printer, Barcode as BarcodeIcon, SendHorizonal, Trash2,
} from "lucide-react";
import { type SampleRecord } from "@/data/sampleRecords";
import { printRecordReport, printBarcode } from "@/lib/printUtils";

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

function SampleGroupedTable({ data, onView, onEdit, onConfirm, onDelete }: Props) {
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
      <div className="text-center py-12 text-muted-foreground text-sm border rounded-lg bg-card">
        No records found
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Sample ID</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Patient</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Tests</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Sample Type</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Priority</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Barcode</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Collected</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Storage</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Collect By</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const first = group.records[0];
            const uniqueTests = [...new Map(group.records.map(r => [r.testName, r])).values()];
            const uniqueSampleTypes = [...new Map(group.records.map(r => [r.sampleType, r])).values()];
            const uniquePriorities = [...new Set(group.records.map(r => r.priority))];
            const uniqueBarcodes = group.records.map(r => r.barcode);
            const uniqueStorage = [...new Set(group.records.map(r => r.storageTemp))];
            const uniqueCollectors = [...new Set(group.records.map(r => r.collectedBy).filter(Boolean))];
            const uniqueStatuses = [...new Set(group.records.map(r => r.status))];

            return (
              <tr
                key={`${group.patient}__${group.patientId}`}
                className="border-b border-border hover:bg-muted/30 transition-colors align-top"
              >
                {/* Sample ID */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {group.records.map(r => (
                      <div key={r.id} className="text-card-foreground font-mono text-xs">{r.id}</div>
                    ))}
                  </div>
                </td>

                {/* Patient */}
                <td className="px-4 py-3">
                  <div className="font-medium text-card-foreground">{group.patient}</div>
                  <div className="text-xs text-muted-foreground">
                    {group.patientId} · {group.age}y · {group.gender}
                  </div>
                  {group.records.length > 1 && (
                    <div className="mt-1 text-xs font-medium text-primary">
                      {group.records.length} samples
                    </div>
                  )}
                </td>

                {/* Tests - clickable badges */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {uniqueTests.map(r => (
                      <Badge
                        key={r.id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                        onClick={() => onView(r)}
                      >
                        {r.testName}
                      </Badge>
                    ))}
                  </div>
                </td>

                {/* Sample Types - clickable badges */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {uniqueSampleTypes.map(r => (
                      <Badge
                        key={r.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent transition-colors text-xs capitalize"
                        onClick={() => onView(r)}
                      >
                        {r.sampleType}
                      </Badge>
                    ))}
                  </div>
                </td>

                {/* Priority */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {uniquePriorities.map(p => (
                      <StatusBadge key={p} status={p} />
                    ))}
                  </div>
                </td>

                {/* Barcode */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {uniqueBarcodes.map((b, i) => (
                      <div key={i} className="font-mono text-xs bg-muted px-2 py-0.5 rounded inline-block">{b}</div>
                    ))}
                  </div>
                </td>

                {/* Collected */}
                <td className="px-4 py-3">
                  {first.collectionTime ? (
                    <div>
                      <div className="text-card-foreground text-xs">{first.collectionDate}</div>
                      <div className="text-xs text-muted-foreground">{first.collectionTime}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Not yet</span>
                  )}
                </td>

                {/* Storage */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {uniqueStorage.map(s => (
                      <span key={s} className="capitalize text-xs">{s}</span>
                    ))}
                  </div>
                </td>

                {/* Collected By */}
                <td className="px-4 py-3">
                  {uniqueCollectors.length > 0 ? (
                    <div className="text-xs">{uniqueCollectors.join(", ")}</div>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Unassigned</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {uniqueStatuses.map(s => (
                      <StatusBadge key={s} status={(s === "failed" ? "rejected" : s) as any} />
                    ))}
                  </div>
                </td>

                {/* Actions - for each record */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-0.5">
                    {group.records.map(r => (
                      <div key={r.id} className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" title={`View ${r.testName}`} onClick={() => onView(r)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" title={`Edit ${r.testName}`} onClick={() => onEdit(r)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="Print Barcode" onClick={() => printBarcode(r.id, r.patient)}>
                          <BarcodeIcon className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="Print" onClick={() => handlePrint(r)}>
                          <Printer className="w-3 h-3 text-primary" />
                        </Button>
                        {(r.status === "pending" || r.status === "collected") && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Send to Lab" onClick={() => onConfirm(r)}>
                            <SendHorizonal className="w-3 h-3 text-primary" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="Delete" onClick={() => onDelete(r)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default SampleGroupedTable;
