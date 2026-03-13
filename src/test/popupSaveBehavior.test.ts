import { createTabCleanupPlan } from "../lib/tabCleanup";

describe("popup after-save cleanup plan", () => {
  it("keeps one placeholder tab plan when closing saved tabs", () => {
    const plan = createTabCleanupPlan(
      [
        { id: 11, windowId: 7 },
        { id: 12, windowId: 7 }
      ],
      [
        { id: 11, windowId: 7 },
        { id: 12, windowId: 7 }
      ]
    );

    expect(plan).toEqual({
      placeholderWindowId: 7,
      tabIdsToClose: [11, 12]
    });
  });

  it("ignores tabs without ids and skips placeholder creation when nothing can be closed", () => {
    const plan = createTabCleanupPlan(
      [
        { windowId: 7 },
        { id: undefined, windowId: 7 }
      ],
      [
        { windowId: 7 },
        { id: undefined, windowId: 7 }
      ]
    );

    expect(plan).toEqual({
      placeholderWindowId: null,
      tabIdsToClose: []
    });
  });

  it("does not create a placeholder when only selected tabs are being closed", () => {
    const plan = createTabCleanupPlan(
      [
        { id: 11, windowId: 7 },
        { id: 12, windowId: 7 },
        { id: 13, windowId: 7 }
      ],
      [
        { id: 11, windowId: 7 },
        { id: 12, windowId: 7 }
      ]
    );

    expect(plan).toEqual({
      placeholderWindowId: null,
      tabIdsToClose: [11, 12]
    });
  });
});
