# Cloudflare Image API Wrapper 🌐

A simple and effective JavaScript library to interact with the Cloudflare Image API. This wrapper simplifies tasks such as uploading, listing, and managing images in your Cloudflare account. 🚀

## Features 🌟

- **Image Uploads** 📤: Upload images directly from URLs or files.
- **Image Management** 🗂: List images, delete images, and update image metadata.
- **Image Retrieval** 🖼: Retrieve details about specific images and download them.
- **Batch Requests** 📦: Supports batch token management for efficient API usage.
- **Custom ID Validation** 🔍: Includes methods to validate and handle custom IDs.
- **UUID Encoding/Decoding** 🔑: Encode UUIDs to Base64 and decode them back.

## Installation 💾

Install the library using npm:

```bash
npm install cloudflare-images-kit
```

## Usage 🛠

### Configuration

First, configure your Cloudflare account details:

```javascript
import CloudflareImages from "cloudflare-images-kit";

const config = {
  accountId: process.env.ACCOUNT_ID,
  apiKey: process.env.API_KEY,
};

const client = new CloudflareImages(config);
```

## Contributing 🤝

Contributions are welcome! Please fork the repository and submit pull requests with your proposed changes. For major changes, please open an issue first to discuss what you would like to change.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact 📬

If you have any questions or need support with the library, please open an issue in the repository.
