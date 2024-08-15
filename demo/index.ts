import CloudflareImages from "../src/index";
import { v4 as uuidv4 } from "uuid";

const cloudflareImages = new CloudflareImages({
  accountId: process.env.ACCOUNT_ID!,
  apiKey: process.env.API_KEY!,
});

const isValid = cloudflareImages.isValidCustomId(uuidv4());
console.log(isValid); // false, UUID is not a valid custom ID
const isValid2 = cloudflareImages.isValidCustomId(
  cloudflareImages.encodeUUID(uuidv4())
);
console.log(isValid2); // true, valid custom ID

const id = uuidv4();
const encoded = cloudflareImages.encodeUUID(id);
console.log(encoded); // Encoded UUID
const decoded = cloudflareImages.decodeUUID(encoded);
console.log(decoded); // Original UUID

async () => {
  const res = await cloudflareImages.uploadImage(
    "https://picsum.photos/id/237/1280/720", // Image URL
    cloudflareImages.encodeUUID(uuidv4()), // Optional, custom ID
    {
      key1: "value1",
      key2: "value2",
    }, // Optional, metadata
    false // Optional, requireSignedURLs
  );
  if (!res) return;
  const { result, success, errors, messages } = res;
  console.log(result, success, errors, messages);
  const { id, filename, meta, uploaded, requireSignedURLs, variants } = result;
  console.log(id, filename, meta, uploaded, requireSignedURLs, variants);
};

async () => {
  const res = await cloudflareImages.uploadImageWithFile(
    new File([""], "filename.jpg"), // Image File
    cloudflareImages.encodeUUID(uuidv4()), // Optional, custom ID
    {
      key1: "value1",
      key2: "value2",
    }, // Optional, metadata
    false // Optional, requireSignedURLs
  );
  if (!res) return;
  // Same as uploadImage response
};

async () => {
  const imageUrl = "https://picsum.photos/id/237/1280/720";
  const buffer = await fetch(imageUrl)
    .then((res) => res.arrayBuffer())
    .then((arrayBuffer) => Buffer.from(arrayBuffer));
  const res = await cloudflareImages.uploadImageWithBuffer(
    buffer, // Image Buffer
    "image.jpg", // Image Filename
    cloudflareImages.encodeUUID(uuidv4()), // Optional, custom ID
    {
      key1: "value1",
      key2: "value2",
    }, // Optional, metadata
    false // Optional, requireSignedURLs
  );
  if (!res) return;
  // Same as uploadImage response
};

async () => {
  const res = await cloudflareImages.listImages();
  if (!res) return;
  const { result, success, errors, messages } = res;
  console.log(result, success, errors, messages);
  const { images } = result;
  console.log(images); // Array of Image
};

async () => {
  const res = await cloudflareImages.getUsageStats();
  if (!res) return;
  const { result, success, errors, messages } = res;
  console.log(result, success, errors, messages);
  const {
    count: { allowed, current },
  } = result;
  console.log(allowed, current); // Allowed uploads and current uploads count
};

async () => {
  const images = await cloudflareImages.getFullListImages();
  if (!images) return;
  console.log(images); // Array of Image
};

async () => {
  const success = await cloudflareImages.deleteImage("imageID");
  console.log(success); // true
};

async () => {
  const res = await cloudflareImages.getImageDetails("imageID");
  if (!res) return;
  // Same as uploadImage response
};

async () => {
  const res = await cloudflareImages.updateImage(
    "imageID",
    {
      key1: "value1",
      key2: "value2",
    }, // Optional, metadata
    false // Optional, requireSignedURLs
  );
  if (!res) return;
  // Same as uploadImage response
};

async () => {
  const blob = await cloudflareImages.getBaseImage("imageID");
  if (!blob) return;
  console.log(blob); // Blob
};

async () => {
  const success = await cloudflareImages.refreshBatchToken();
  console.log(success); // true
  if (success) {
    // Batch operations turn on, 200 requests per batch
    // Batch operations:
    // uploadImage
    // uploadImageWithFile
    // uploadImageWithBuffer
    // updateImage
    // getImageDetails
    // deleteImage

    const promises = Array.from({ length: 200 }, () =>
      cloudflareImages.uploadImage(
        "https://picsum.photos/id/237/1280/720",
        cloudflareImages.encodeUUID(uuidv4())
      )
    );
    await Promise.all(promises);
  }
};
