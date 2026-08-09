import { addProjectPolish, polishWorkflowSignature, touchRecentPolish } from "./polishWorkflow";

const cream = { id: "rose", name: "Rose", colorHex: "#E8A0BF", polishType: "Cream", shine: .62 };
const jelly = { ...cream, id: "rose-jelly", polishType: "Jelly", transparency: .42 };

test("project palette preserves order, prevents duplicates, and distinguishes material formulations", () => {
  const palette = addProjectPolish(addProjectPolish([], cream), { ...cream });
  expect(palette).toEqual([cream]);
  expect(addProjectPolish(palette, jelly)).toEqual([cream, jelly]);
  expect(polishWorkflowSignature(jelly)).not.toBe(polishWorkflowSignature(cream));
});

test("recent polish is unique, bounded, and moves the latest interaction first", () => {
  const glitter = { ...cream, name: "Spark", polishType: "Glitter", sparkleDensity: .55 };
  expect(touchRecentPolish([cream, jelly], cream)).toEqual([cream, jelly]);
  expect(touchRecentPolish([cream, jelly], glitter, 2)).toEqual([glitter, cream]);
});
