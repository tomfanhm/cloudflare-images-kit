import {
  RefreshBatchTokenResponseSchema,
  DeleteImageResponseSchema,
  GetImageDetailsResponseSchema,
  ListImagesResponseSchema,
  UploadImageResponseSchema,
  GetUsageStatsResponseSchema,
  ImageResultSchema,
  UpdateImageResponseSchema,
} from "./validations";
interface CloudflareImagesConfig {
  accountId: string;
  apiKey: string;
}

class CloudflareImages {
  private config: CloudflareImagesConfig;
  private batchToken: {
    token: string | null;
    expiresAt: string | null;
    requests: number;
  };
  constructor(config: CloudflareImagesConfig) {
    this.config = config;
    this.batchToken = {
      token: null,
      expiresAt: null,
      requests: 0,
    };
  }
  // Get the base URL for the API request
  private getBaseUrl(path: string, isBatchMethod: boolean = false): string {
    // Check if the batch is enabled
    if (isBatchMethod && this.batchToken.token)
      return `https://batch.imagedelivery.net${path}`;
    return `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}${path}`;
  }
  // Get the API token
  private getToken(isBatchMethod: boolean = false) {
    // Check if the batch token is available
    if (isBatchMethod && this.batchToken.token) return this.batchToken.token;
    return this.config.apiKey;
  }
  // Reset the batch token if it has expired and the number of requests exceeds the limit of 200
  // expiresAt: 2023-08-09T15:33:56.273411222Z
  private checkBatchToken(): void {
    if (this.batchToken.token && this.batchToken.expiresAt) {
      this.batchToken.requests++; // Increment the number of requests
      const now = new Date().toISOString();
      if (now > this.batchToken.expiresAt || this.batchToken.requests >= 200) {
        this.batchToken.token = null;
        this.batchToken.expiresAt = null;
        this.batchToken.requests = 0;
      }
    }
  }
  // Check if the custom ID is valid
  isValidCustomId(customId: string): boolean {
    // Check empty string
    if (!customId) {
      throw new Error("Custom ID cannot be an empty string.");
    }
    // Check no slashes
    if (customId.startsWith("/") || customId.endsWith("/")) {
      throw new Error("Custom ID cannot start or end with a slash.");
    }
    // Check for full UUIDv4
    const regex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (regex.test(customId)) {
      throw new Error("Custom ID cannot be a full UUIDv4.");
    }
    // Check for maximum length
    if (customId.length > 1024) {
      throw new Error(
        "Custom ID exceeds the maximum allowed length of 1024 characters."
      );
    }
    return true;
  }
  // Encode a UUID to Base64
  encodeUUID(uuid: string): string {
    // Convert UUID to a byte array (assuming UUID is in standard format)
    const hexBytes = uuid.replace(/-/g, "");
    const buffer = new Uint8Array(hexBytes.length / 2);
    for (let i = 0; i < hexBytes.length; i += 2) {
      buffer[i / 2] = parseInt(hexBytes.substring(i, i + 2), 16);
    }

    // Convert byte array to Base64 string
    const base64String = btoa(
      String.fromCharCode.apply(null, Array.from(buffer))
    );
    return base64String;
  }
  // Decode a Base64 string to UUID
  decodeUUID(encoded: string): string {
    // Decode Base64 string to byte array
    const binaryString = atob(encoded);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      buffer[i] = binaryString.charCodeAt(i);
    }

    // Convert byte array to UUID format
    let uuid = "";
    buffer.forEach((byte, index) => {
      const hex = byte.toString(16).padStart(2, "0");
      uuid += hex;
      if ([3, 5, 7, 9].includes(index)) uuid += "-";
    });

    return uuid;
  }
  // Parse the response from the zod schema
  private async handleResponse<T>(
    response: Response,
    parser: (el: unknown) => T
  ): Promise<T> {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    return parser(data);
  }
  // Upload an image to Cloudflare Images
  // Validate an image file
  private async validateImage(file: File): Promise<boolean> {
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File size exceeds maximum limit of 10 MB.");
    }

    // Validate image type
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      throw new Error("Unsupported image format.");
    }
    return true;
  }
  // Upload an image to Cloudflare Images
  async uploadImage(
    url: string,
    customId: string | null = null,
    metadata: Record<string, any> = {},
    requireSignedURLs: boolean = false
  ): Promise<UploadImageResponseSchema | null> {
    const baseUrl = this.getBaseUrl("/images/v1", true);
    try {
      const formData = new FormData();
      formData.append("url", url);
      formData.append("metadata", JSON.stringify(metadata));
      formData.append("requireSignedURLs", requireSignedURLs.toString());
      if (customId && this.isValidCustomId(customId)) {
        formData.append("id", customId);
      }

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getToken(true)}`,
        },
        body: formData,
      });

      return await this.handleResponse(
        response,
        UploadImageResponseSchema.parse
      );
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      this.checkBatchToken();
    }
    return null;
  }
  // Upload an image file to Cloudflare Images
  async uploadImageWithFile(
    file: File,
    customId: string | null = null,
    metadata: Record<string, any> = {},
    requireSignedURLs: boolean = false
  ) {
    const baseUrl = this.getBaseUrl("/images/v1", true);
    try {
      await this.validateImage(file);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("metadata", JSON.stringify(metadata));
      formData.append("requireSignedURLs", requireSignedURLs.toString());
      if (customId && this.isValidCustomId(customId)) {
        formData.append("id", customId);
      }
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getToken(true)}`,
        },
        body: formData,
      });
      return await this.handleResponse(
        response,
        UploadImageResponseSchema.parse
      );
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      this.checkBatchToken();
    }
    return null;
  }
  // Upload an image buffer to Cloudflare Images
  async uploadImageWithBuffer(
    buffer: Buffer,
    filename: string,
    customId: string | null = null,
    metadata: Record<string, any> = {},
    requireSignedURLs: boolean = false
  ) {
    const baseUrl = this.getBaseUrl("/images/v1", true);
    try {
      const formData = new FormData();
      const file = new File([new Uint8Array(buffer)], filename, {
        type: "image/*",
      });
      formData.append("file", file);
      formData.append("metadata", JSON.stringify(metadata));
      formData.append("requireSignedURLs", requireSignedURLs.toString());
      if (customId && this.isValidCustomId(customId)) {
        formData.append("id", customId);
      }
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getToken(true)}`,
        },
        body: formData,
      });
      return await this.handleResponse(
        response,
        UploadImageResponseSchema.parse
      );
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      this.checkBatchToken();
    }
    return null;
  }
  // List images in the account
  async listImages(
    page: number = 1,
    perPage: number = 1000
  ): Promise<ListImagesResponseSchema | null> {
    const baseUrl = this.getBaseUrl("/images/v1");
    try {
      // >= 10 and <= 10000
      if (perPage < 10 || perPage > 10000) {
        throw new Error("perPage must be between 10 and 10000.");
      }
      const urlWithParams = `${baseUrl}?page=${page}&per_page=${perPage}`;
      const response = await fetch(urlWithParams, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
      return await this.handleResponse(
        response,
        ListImagesResponseSchema.parse
      );
    } catch (error) {
      console.error("Error listing images:", error);
    }
    return null;
  }
  // Get usage statistics for the account
  async getUsageStats(): Promise<GetUsageStatsResponseSchema | null> {
    const baseUrl = this.getBaseUrl("/images/v1/stats");
    try {
      const response = await fetch(baseUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
      return await this.handleResponse(
        response,
        GetUsageStatsResponseSchema.parse
      );
    } catch (error) {
      console.error("Error getting usage stats:", error);
    }
    return null;
  }
  // Get the full list of images in the account
  async getFullListImages(): Promise<ImageResultSchema[] | null> {
    try {
      const stats = await this.getUsageStats();
      if (!stats) {
        throw new Error("Failed to obtain usage statistics.");
      }
      const total = stats.result.count.current;
      let page = 1;
      let perPage = 10000; // Maximum per_page value
      let images: ImageResultSchema[] = [];
      const promises = Array.from(
        { length: Math.ceil(total / perPage) },
        async () => {
          const response = await this.listImages(page++, perPage);
          if (!response) throw new Error("Failed to obtain image list.");
          if (!response.success)
            throw new Error("Failed to obtain image list.");
          images = images.concat(response.result.images);
        }
      );
      await Promise.all(promises);
      return images;
    } catch (error) {
      console.error("Error getting full image list:", error);
    }
    return null;
  }
  // Delete an image by ID
  async deleteImage(id: string): Promise<boolean> {
    const baseUrl = this.getBaseUrl(`/images/v1/${id}`, true);
    try {
      const response = await fetch(baseUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.getToken(true)}`,
        },
      });

      return await this.handleResponse(
        response,
        DeleteImageResponseSchema.parse
      ).then((res) => res.success);
    } catch (error) {
      console.error("Error deleting image:", error);
    } finally {
      this.checkBatchToken();
    }
    return false;
  }
  // Get image details by ID
  async getImageDetails(
    id: string
  ): Promise<GetImageDetailsResponseSchema | null> {
    const baseUrl = this.getBaseUrl(`/images/v1/${id}`, true);
    try {
      const response = await fetch(baseUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getToken(true)}`,
        },
      });
      return await this.handleResponse(
        response,
        GetImageDetailsResponseSchema.parse
      );
    } catch (error) {
      console.error("Error getting image details:", error);
    } finally {
      this.checkBatchToken();
    }
    return null;
  }
  // Update image metadata by ID
  async updateImage(
    id: string,
    metadata: Record<string, any> = {},
    requireSignedURLs: boolean = false
  ): Promise<UpdateImageResponseSchema | null> {
    const baseUrl = this.getBaseUrl(`/images/v1/${id}`, true);
    try {
      const formData = new FormData();
      formData.append("metadata", JSON.stringify(metadata));
      formData.append("requireSignedURLs", requireSignedURLs.toString());
      const response = await fetch(baseUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.getToken(true)}`,
        },
        body: formData,
      });
      return await this.handleResponse(
        response,
        UpdateImageResponseSchema.parse
      );
    } catch (error) {
      console.error("Error updating image:", error);
    } finally {
      this.checkBatchToken();
    }
    return null;
  }
  // Get the base image by ID
  async getBaseImage(id: string): Promise<Blob | null> {
    const baseUrl = this.getBaseUrl(`/images/v1/${id}/blob`);
    try {
      const response = await fetch(baseUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return await response.blob();
    } catch (error) {
      console.error("Error getting base image:", error);
    }
    return null;
  }
  // Refresh batch token
  async refreshBatchToken(): Promise<boolean> {
    const baseUrl = this.getBaseUrl("/images/v1/batch_token");
    try {
      const response = await fetch(baseUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      const parse = RefreshBatchTokenResponseSchema.parse(data);
      if (!parse.success) throw new Error("Failed to obtain batch token.");
      this.batchToken.token = parse.result.token;
      this.batchToken.expiresAt = parse.result.expiresAt;
      this.batchToken.requests = 0;
      return true;
    } catch (error) {
      console.error("Error obtaining batch token:", error);
    }
    return false;
  }
}

export default CloudflareImages;
