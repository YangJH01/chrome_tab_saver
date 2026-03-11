import { createAfterSaveCleanupPlan } from "../pages/PopupApp";

describe("popup after-save cleanup plan", () => {
  it("keeps one placeholder tab plan when closing saved tabs", () => {
    const plan = createAfterSaveCleanupPlan([
      { id: 11, windowId: 7 },
      { id: 12, windowId: 7 }
    ]);

    expect(plan).toEqual({
      placeholderWindowId: 7,
      tabIdsToClose: [11, 12]
    });
  });

  it("ignores tabs without ids and skips placeholder creation when nothing can be closed", () => {
    const plan = createAfterSaveCleanupPlan([
      { windowId: 7 },
      { id: undefined, windowId: 7 }
    ]);

    expect(plan).toEqual({
      placeholderWindowId: null,
      tabIdsToClose: []
    });
  });
});
