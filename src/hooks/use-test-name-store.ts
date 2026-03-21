import { useSyncExternalStore } from "react";
import { testNameStore } from "@/data/testNameStore";

export function useTestNameStore() {
  const tests = useSyncExternalStore(
    testNameStore.subscribe,
    testNameStore.getTests,
  );
  const categories = useSyncExternalStore(
    testNameStore.subscribe,
    testNameStore.getCategories,
  );
  const sampleTypesList = useSyncExternalStore(
    testNameStore.subscribe,
    testNameStore.getSampleTypes,
  );
  const activeTests = tests.filter((t) => t.active);
  const activeTestNames = activeTests.map((t) => t.name);

  return {
    tests,
    activeTests,
    activeTestNames,
    categories,
    sampleTypes: sampleTypesList,
    findByName: testNameStore.findByName,
    addTest: testNameStore.addTest,
    updateTest: testNameStore.updateTest,
    removeTest: testNameStore.removeTest,
    addCategory: testNameStore.addCategory,
    removeCategory: testNameStore.removeCategory,
    addSampleType: testNameStore.addSampleType,
    removeSampleType: testNameStore.removeSampleType,
  };
}
