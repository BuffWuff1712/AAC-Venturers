import { Suspense } from "react";
import { EditScenarioView } from "../../../views/EditScenarioView";

export default function CaregiverScenarioPage() {
  return (
    <Suspense fallback={null}>
      <EditScenarioView />
    </Suspense>
  );
}
