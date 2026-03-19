import { useSyncExternalStore } from "react";
import { testNameStore } from "@/data/testNameStore";

export function useTestNameStore() {
  const tests = useSyncExternalStore(
    testNameStore.subscribe,
    testNameStore.getTests,
  );
  const activeTests = tests.filter((t) => t.active);
  const activeTestNames = activeTests.map((t) => t.name);

  return {
    tests,
    activeTests,
    activeTestNames,
    findByName: testNameStore.findByName,
    addTest: testNameStore.addTest,
    updateTest: testNameStore.updateTest,
    removeTest: testNameStore.removeTest,
  };
}
