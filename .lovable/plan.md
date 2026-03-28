

## Fix: Lab Reports Edit dialog - Sample Type not auto-populating

### Problem
The Lab Reports Edit dialog uses a hardcoded list of sample types (Blood, Urine, Stool, etc.) that doesn't include custom values from Test Name Management (e.g., "Serum", "Plasma", "Whole Blood"). When a report has a sample type not in the hardcoded list, the dropdown shows blank.

This is the same issue that was just fixed for Sample Collection.

### Solution

**File: `src/pages/LabReportsPage.tsx`**

1. Import `useMemo` from React
2. Pull `sampleTypes` from `useTestNameStore()` (already imported)
3. Build a dynamic `availableSampleTypes` list by merging:
   - Sample types from Test Name Management config
   - Sample types from existing lab report records
   - The current form's sampleType value
4. Replace the hardcoded `<SelectItem>` list with a dynamic `.map()` over `availableSampleTypes`

This mirrors the exact fix already applied to `SampleCollectionPage.tsx`.

