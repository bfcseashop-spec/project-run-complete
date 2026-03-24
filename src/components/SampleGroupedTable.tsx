import React from "react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Eye, Pencil, Printer, Barcode as BarcodeIcon, SendHorizonal, Trash2,
  Droplets, FlaskConical, TestTube, ClipboardList, Thermometer, ThermometerSun, Snowflake,
} from "lucide-react";
import { type SampleRecord } from "@/data/sampleRecords";
import { printRecordReport, printBarcode } from "@/lib/printUtils";

const sampleTypeIcons: Record<string, React.ElementType> = {
  blood: Droplets, urine: FlaskConical, stool: FlaskConical, sputum: FlaskConical,
  swab: TestTube, tissue: TestTube, csf: Droplets, other: ClipboardList,
};

const storageTempIcons: Record<string, React.ElementType> = {
  room: ThermometerSun, refrigerated: Thermometer, frozen: Snowflake,
};

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
}

function SampleGroupedTable({ data, onView, onEdit, onConfirm, onDelete }: Props) {
  // Group records by patient name
  const groups: PatientGroup[] = [];
  const groupMap = new Map<string, PatientGroup>();

  data.forEach((r) => {
    const key = `${r.patient}__${r.patientId}`;
    if (!groupMap.has(key)) {
      const group: PatientGroup = {
        patient: r.patient,
        patientId: r.patientId,
        age: r.age,
        gender: r.gender,
        records: [],
      };
      groupMap.set(key, group);
      groups.push(group);
    }
    groupMap.get(key)!.records.push(r);
  });

  const handlePrint = (r: SampleRecord) => {
    printRecordReport({
      id: r.id,
      sectionTitle: "Sample Collection Report",
      fields: [
        { label: "Patient", value: r.patient },
        { label: "Patient ID", value: r.patientId },
        { label: "Test", value: r.testName },
        { label: "Sample Type", value: r.sampleType },
        { label: "Priority", value: r.priority },
        { label: "Barcode", value: r.barcode },
        { label: "Collection Date", value: r.collectionDate },
        { label: "Collection Time", value: r.collectionTime || "N/A" },
        { label: "Storage", value: r.storageTemp },
        { label: "Collected By", value: r.collectedBy || "Unassigned" },
        { label: "Status", value: r.status },
        { label: "Notes", value: r.notes || "—" },
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
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Test</th>
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
          {groups.map((group) => (
            <React.Fragment key={`${group.patient}__${group.patientId}`}>
              {group.records.map((r, idx) => {
                const SampleIcon = sampleTypeIcons[r.sampleType] || TestTube;
                const StorageIcon = storageTempIcons[r.storageTemp] || Thermometer;
                const isFirst = idx === 0;
                const isLast = idx === group.records.length - 1;

                return (
                  <tr
                    key={r.id}
                    className={`border-b border-border hover:bg-muted/30 transition-colors ${
                      !isLast && group.records.length > 1 ? "border-b-dashed" : ""
                    }`}
                  >
                    {/* Sample ID */}
                    <td className="px-4 py-3 text-card-foreground">{r.id}</td>

                    {/* Patient - only show on first row, span all rows in group */}
                    {isFirst ? (
                      <td
                        className="px-4 py-3 align-middle"
                        rowSpan={group.records.length}
                      >
                        <div className="font-medium text-card-foreground">{group.patient}</div>
                        <div className="text-xs text-muted-foreground">
                          {group.patientId} · {group.age}y · {group.gender}
                        </div>
                        {group.records.length > 1 && (
                          <div className="mt-1 text-xs font-medium text-primary">
                            {group.records.length} tests
                          </div>
                        )}
                      </td>
                    ) : null}

                    {/* Test Name */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-card-foreground">{r.testName}</span>
                    </td>

                    {/* Sample Type */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <SampleIcon className="w-4 h-4 text-primary" />
                        <span className="capitalize">{r.sampleType}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <StatusBadge status={r.priority} />
                    </td>

                    {/* Barcode */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{r.barcode}</span>
                    </td>

                    {/* Collected */}
                    <td className="px-4 py-3">
                      {r.collectionTime ? (
                        <div>
                          <div className="text-card-foreground">{r.collectionDate}</div>
                          <div className="text-xs text-muted-foreground">{r.collectionTime}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Not yet</span>
                      )}
                    </td>

                    {/* Storage */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <StorageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="capitalize text-xs">{r.storageTemp}</span>
                      </div>
                    </td>

                    {/* Collected By */}
                    <td className="px-4 py-3">
                      {r.collectedBy || <span className="text-muted-foreground italic text-xs">Unassigned</span>}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={(r.status === "failed" ? "rejected" : r.status) as any} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => onView(r)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => onEdit(r)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Barcode" onClick={() => printBarcode(r.id, r.patient)}>
                          <BarcodeIcon className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Print" onClick={() => handlePrint(r)}>
                          <Printer className="w-3.5 h-3.5 text-primary" />
                        </Button>
                        {(r.status === "pending" || r.status === "collected") && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title={r.status === "pending" ? "Confirm & Send to Lab" : "Send to Lab Reports"} onClick={() => onConfirm(r)}>
                            <SendHorizonal className="w-3.5 h-3.5 text-primary" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Delete" onClick={() => onDelete(r)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SampleGroupedTable;
