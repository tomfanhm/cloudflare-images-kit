import CloudflareImages from "../src/index";
import { v1 as uuidv1, v4 as uuidv4 } from "uuid";

describe("CloudflareImage", () => {
  const cloudflareImages = new CloudflareImages({
    accountId: process.env.ACCOUNT_ID!,
    apiKey: process.env.API_KEY!,
  });
  // Test function isValidCustomId
  describe("isValidCustomId", () => {
    test("should throw an error if custom ID is an empty string", () => {
      const testId = "";
      expect(() => cloudflareImages.isValidCustomId(testId)).toThrow(
        "Custom ID cannot be an empty string."
      );
    });

    test("should throw an error if custom ID starts with a slash", () => {
      const testId = "/invalidId";
      expect(() => cloudflareImages.isValidCustomId(testId)).toThrow(
        "Custom ID cannot start or end with a slash."
      );
    });

    test("should throw an error if custom ID ends with a slash", () => {
      const testId = "invalidId/";
      expect(() => cloudflareImages.isValidCustomId(testId)).toThrow(
        "Custom ID cannot start or end with a slash."
      );
    });

    test("should throw an error if custom ID is a full UUIDv4", () => {
      const testId = uuidv4();
      expect(() => cloudflareImages.isValidCustomId(testId)).toThrow(
        "Custom ID cannot be a full UUIDv4."
      );
    });

    it("should throw error for custom IDs longer than 1024 characters", () => {
      const longId = "a".repeat(1025);
      expect(() => cloudflareImages.isValidCustomId(longId)).toThrow(
        "Custom ID exceeds the maximum allowed length of 1024 characters."
      );
    });

    test("should return true for valid custom ID", () => {
      const testId = "validCustomId123";
      expect(cloudflareImages.isValidCustomId(testId)).toBe(true);
    });

    test("should return true for valid encoded ID", () => {
      const testId = uuidv4();
      const encodedId = cloudflareImages.encodeUUID(testId);
      expect(cloudflareImages.isValidCustomId(encodedId)).toBe(true);
    });
  });
  // Test function encodeUUID and decodeUUID
  describe("encodeUUID and decodeUUID", () => {
    test("should encode and decode a UUIDv4", () => {
      const uuid = uuidv4();
      const encoded = cloudflareImages.encodeUUID(uuid);
      const decoded = cloudflareImages.decodeUUID(encoded);
      expect(decoded).toBe(uuid);
    });

    test("should encode and decode a UUIDv1", () => {
      const uuid = uuidv1();
      const encoded = cloudflareImages.encodeUUID(uuid);
      const decoded = cloudflareImages.decodeUUID(encoded);
      expect(decoded).toBe(uuid);
    });
  });
  // Test function uploadImage
  describe("uploadImage", () => {
    test("should upload an image from URL", async () => {
      const imageUrl = "https://picsum.photos/id/237/1280/720";
      const response = await cloudflareImages.uploadImage(imageUrl);
      expect(response?.success).toBe(true);
    });

    test("should upload an image with custom ID", async () => {
      const imageUrl = "https://picsum.photos/id/237/1280/720";
      const customId = cloudflareImages.encodeUUID(uuidv4());
      const response = await cloudflareImages.uploadImage(imageUrl, customId);
      expect(response?.success).toBe(true);
    });

    test("should upload an image with metadata", async () => {
      const imageUrl = "https://picsum.photos/id/237/1280/720";
      const metadata = {
        key1: "value1",
        key2: "value2",
      };
      const response = await cloudflareImages.uploadImage(
        imageUrl,
        null,
        metadata
      );
      expect(response?.success).toBe(true);
    });
  });
  // Test function listImages
  describe("listImages", () => {
    test("should list images", async () => {
      const response = await cloudflareImages.listImages(1, 1000);
      expect(response?.success).toBe(true);
    });

    test("should not list images with invalid page number and per page number", async () => {
      const response = await cloudflareImages.listImages(0, 100000);
      expect(response).toBeNull();
    });
  });
  // Test function getUsageStats
  describe("getUsageStats", () => {
    test("should get usage stats", async () => {
      const response = await cloudflareImages.getUsageStats();
      expect(response?.success).toBe(true);
    });
  });
  // Test function getFullListImages
  describe("getFullListImages", () => {
    test("should get full list of images", async () => {
      const response = await cloudflareImages.getFullListImages();
      expect(response).not.toBeNull();
    });
  });
  // Test function deleteImage
  describe("deleteImage", () => {
    test("should delete an image", async () => {
      const imageUrl = "https://picsum.photos/id/237/1280/720";
      const imageId = cloudflareImages.encodeUUID(uuidv4());
      await cloudflareImages.uploadImage(imageUrl, imageId);
      const success = await cloudflareImages.deleteImage(imageId);
      expect(success).toBe(true);
    });

    test("should not delete an image with invalid ID", async () => {
      const imageId = cloudflareImages.encodeUUID(uuidv4());
      const success = await cloudflareImages.deleteImage(imageId);
      expect(success).toBe(false);
    });
  });
  // Test function getImageDetails
  describe("getImageDetails", () => {
    test("should get image details", async () => {
      const id = "BwBmwTIvwH7Ul5HIayDP";
      const details = await cloudflareImages.getImageDetails(id);
      expect(details?.success).toBe(true);
    });

    test("should not get image details with invalid ID", async () => {
      const imageId = cloudflareImages.encodeUUID(uuidv4());
      const details = await cloudflareImages.getImageDetails(imageId);
      expect(details).toBeNull();
    });
  });
  // Test function refreshBatchToken
  describe("refreshBatchToken", () => {
    test("should refresh batch token", async () => {
      const response = await cloudflareImages.refreshBatchToken();
      expect(response).toBe(true);
    });
  });
  // Test Batch API
  describe("Batch API", () => {
    test(
      "should upload images and delete images in batch",
      async () => {
        await cloudflareImages.refreshBatchToken();
        const ids = Array.from({ length: 5 }, () =>
          cloudflareImages.encodeUUID(uuidv4())
        );
        const imageUrl = "https://picsum.photos/id/237/1280/720";
        const uploadResponses = await Promise.all(
          ids.map((id) => cloudflareImages.uploadImage(imageUrl, id))
        );
        const deleteResponses = await Promise.all(
          ids.map((id) => cloudflareImages.deleteImage(id))
        );
        expect(uploadResponses.every((r) => r?.success)).toBe(true);
        expect(deleteResponses.every((r) => r)).toBe(true);
      },
      20 * 1000
    );
  });
});
