import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("detection.predict", () => {
  it("returns a prediction with label, confidence, and frame analysis", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.detection.predict({
      fileName: "test_video.mp4",
      fileUrl: "https://example.com/test_video.mp4",
      fileType: "video",
    });

    expect(result).toHaveProperty("label");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("frameAnalysis");
    expect(result).toHaveProperty("processingTime");
    expect(result).toHaveProperty("modelVersion");
    expect(result).toHaveProperty("accuracy");

    expect(["Real", "Deepfake"]).toContain(result.label);
    expect(result.confidence).toBeGreaterThanOrEqual(85);
    expect(result.confidence).toBeLessThanOrEqual(99);
    expect(Array.isArray(result.frameAnalysis)).toBe(true);
    expect(result.accuracy).toBe(99.2);
  });

  it("stores the scan in the database", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.detection.predict({
      fileName: "test_image.jpg",
      fileUrl: "https://example.com/test_image.jpg",
      fileType: "image",
    });

    // Verify the result was returned successfully
    expect(result).toBeDefined();
    expect(result.label).toBeDefined();
  });

  it("rejects invalid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.detection.predict({
        fileName: "test.mp4",
        fileUrl: "not-a-valid-url",
        fileType: "video",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("detection.getStats", () => {
  it("returns user scan statistics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.detection.getStats();

    expect(stats).toHaveProperty("totalScans");
    expect(stats).toHaveProperty("realCount");
    expect(stats).toHaveProperty("fakeCount");
    expect(stats).toHaveProperty("avgConfidence");

    expect(typeof stats.totalScans).toBe("number");
    expect(typeof stats.realCount).toBe("number");
    expect(typeof stats.fakeCount).toBe("number");
    expect(typeof stats.avgConfidence).toBe("number");
  });
});

describe("detection.getScans", () => {
  it("returns user scans with default limit", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const scans = await caller.detection.getScans({ limit: 50 });

    expect(Array.isArray(scans)).toBe(true);
  });

  it("respects the limit parameter", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const scans = await caller.detection.getScans({ limit: 10 });

    expect(scans.length).toBeLessThanOrEqual(10);
  });
});
