# Cloudflare Image API Wrapper 🌐

A simple and effective JavaScript library to interact with the Cloudflare Image API. This wrapper simplifies tasks such as uploading, listing, and managing images in your Cloudflare account.

While this library covers a broad range of Cloudflare Image API functionalities, there are certain features not included. These features are more efficiently managed directly through the Cloudflare Dashboard rather than through code.

## Features 🌟

- **Image Uploads**: Upload images directly from URLs or files.
- **Image Management**: List images, delete images, and update image metadata.
- **Image Retrieval**: Retrieve details about specific images and download them.
- **Batch Requests**: Supports batch token management for efficient API usage.
- **Custom ID Validation**: Includes methods to validate and handle custom IDs.
- **UUID Encoding/Decoding**: Encode UUIDs to Base64 and decode them back.

## Environment Compatibility 🚨

Please note that this tool is designed to be used in a Node.js environment only. Due to CORS (Cross-Origin Resource Sharing) restrictions, the Cloudflare Image API cannot be directly accessed from web browsers.

## Installation 💾

Install the library using npm:

```bash
npm install zod cloudflare-images-kit
```

## Usage 🛠

### Configuration

First, configure your Cloudflare account details:

```javascript
import CloudflareImages from "cloudflare-images-kit";

const cloudflareImages = new CloudflareImages({
  accountId: process.env.ACCOUNT_ID,
  apiKey: process.env.API_KEY,
});
```

### Validating Custom IDs

```javascript
const valid = cloudflareImages.isValidCustomId("example-id-123"); // Boolean
```

This function will throw an error if the custom ID:

- Is an empty string.
- Starts or ends with a slash.
- Is a full UUIDv4.
- Exceeds the maximum length of 1024 characters.

### Encoding and Decoding UUIDs

The `encodeUUID` and `decodeUUID` functions provide utilities for encoding a UUID to a Base64 string and decoding it back to a UUID format. Note that UUIDs cannot be used as custom IDs directly in Cloudflare due to their format restrictions.

```javascript
const uuid = uuidv4();
const encoded = cloudflareImages.encodeUUID(uuid); // Outputs the Base64 encoded version of the UUID
const decoded = cloudflareImages.decodeUUID(encoded); // Outputs the original UUID
```

### Uploading an Image

You can upload images directly from URLs or from files using one of the following methods:

#### Upload from URL

To upload an image from a URL, use the `uploadImage` method. You can optionally specify a custom ID, metadata, and whether to require signed URLs for access:

```javascript
async () => {
  const imageUrl = "https://picsum.photos/id/237/1280/720";
  const customId = cloudflareImages.encodeUUID(uuidv4()); // Optional
  const metadata = { key1: "value1", key2: "value2" }; // Optional
  const requireSignedURLs = false; // Optional
  const res = await cloudflareImages.uploadImage(
    imageUrl,
    customId,
    metadata,
    requireSignedURLs
  );
};
```

#### Upload from File

To upload an image from a file, use the uploadImageWithFile method.

```javascript
async () => {
  const customId = cloudflareImages.encodeUUID(uuidv4()); // Optional
  const metadata = { key1: "value1", key2: "value2" }; // Optional
  const requireSignedURLs = false; // Optional
  const res = await cloudflareImages.uploadImageWithFile(
    file, // Image File
    customId,
    metadata,
    requireSignedURLs
  );
};
```

#### Upload from Buffer

To upload an image from a buffer, use the uploadImageWithBuffer method.

```javascript
async () => {
  const customId = cloudflareImages.encodeUUID(uuidv4()); // Optional
  const metadata = { key1: "value1", key2: "value2" }; // Optional
  const requireSignedURLs = false; // Optional
  const res = await cloudflareImages.uploadImageWithBuffer(
    buffer, // Image Buffer
    "image.jpg", // Image Filename
    customId,
    metadata,
    requireSignedURLs
  );
};
```

### Image Management

For managing images, you can list, update, or delete images as follows:

#### List Images

```javascript
async () => {
  const res = await cloudflareImages.listImages();
};
```

#### Listing All Images

```javascript
async () => {
  const images = await cloudflareImages.getFullListImages();
};
```

#### Update Image Metadata

```javascript
async () => {
  const imageId = "your-image-id";
  const metadata = { key1: "new-value1", key2: "new-value2" }; // New metadata
  const requireSignedURLs = false; // Optional
  const res = await cloudflareImages.updateImage(
    imageId,
    metadata,
    requireSignedURLs
  );
};
```

#### Delete an Image

```javascript
async () => {
  const imageId = "your-image-id";
  const res = await cloudflareImages.deleteImage(imageId);
};
```

#### Retrieving Image Details

```javascript
async () => {
  const imageId = "your-image-id";
  const res = await cloudflareImages.getImageDetails(imageId);
};
```

#### Downloading Base Image

If you need to download the original image (as a Blob object), use the getBaseImage method:

```javascript
async () => {
  const imageId = "your-image-id";
  const blob = await cloudflareImages.getBaseImage(imageId);
};
```

### Managing Batch Operations

For efficient management of large numbers of requests, the library supports batch operations. You can refresh the batch token and perform batch operations like uploading, updating, or deleting images:

```javascript
async () => {
  const success = await cloudflareImages.refreshBatchToken();
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
```

### Retrieving Usage Statistics

You can retrieve your Cloudflare Image API usage statistics, including the allowed and current upload counts:

```javascript
async () => {
  const res = await cloudflareImages.getUsageStats();
};
```

## Additional Resources 📚

For more detailed examples and usage patterns, you can refer to the /demo/index.ts file in the repository.

## Contributing 🤝

Contributions are welcome! Please fork the repository and submit pull requests with your proposed changes. For major changes, please open an issue first to discuss what you would like to change.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact 📬

If you have any questions or need support with the library, please open an issue in the repository.
