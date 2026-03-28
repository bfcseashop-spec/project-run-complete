import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import RegisterPatientDialog from "@/components/RegisterPatientDialog";
import { addPatient, getPatients, subscribe } from "@/data/patientStore";
import type { OPDPatient } from "@/data/opdPatients";
import { toast } from "sonner";

const RegisterPatientPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState(getPatients());
  const [nextToken, setNextToken] = useState<number>(0);
  const [tokenLoaded, setTokenLoaded] = useState(false);

  useEffect(() => subscribe(() => setPatients([...getPatients()])), []);

  const loadNextToken = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "last_opd_number").maybeSingle();
    if (data?.value && typeof data.value === "number") {
      setNextToken(data.value + 1);
    } else {
      const maxId = patients.length > 0
        ? Math.max(...patients.map((p) => parseInt(p.id.replace("OPD-", "")) || 0))
        : 400;
      setNextToken(maxId + 1);
    }
    setTokenLoaded(true);
  }, [patients.length]);

  useEffect(() => { loadNextToken(); }, [loadNextToken]);

  const claimNextToken = useCallback(async (): Promise<number> => {
    const token = nextToken;
    await supabase.from("app_settings").upsert({ key: "last_opd_number", value: token as any });
    setNextToken(token + 1);
    return token;
  }, [nextToken]);

  const handleRegister = async (patient: OPDPatient) => {
    const token = await claimNextToken();
    const patientWithId = { ...patient, id: `OPD-${token}` };
    addPatient(patientWithId);
    toast.success(`Patient ${patient.name} registered as OPD-${token}`);
    navigate("/opd");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Register New Patient" description="Add a new patient to the OPD system" />
      {tokenLoaded && (
        <RegisterPatientDialog
          open={true}
          onOpenChange={(open) => { if (!open) navigate("/opd"); }}
          onSubmit={handleRegister}
          nextTokenNumber={nextToken}
          editPatient={null}
          embedded
        />
      )}
    </div>
  );
};

export default RegisterPatientPage;
