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
  /**
   * Returns the base URL for making API requests.
   * @param path - The path of the API endpoint.
   * @param isBatchMethod - Indicates whether the batch method is enabled.
   * @returns The base URL for making API requests.
   */
  private getBaseUrl(path: string, isBatchMethod: boolean = false): string {
    // Check if the batch is enabled
    if (isBatchMethod && this.batchToken.token)
      return `https://batch.imagedelivery.net${path}`;
    return `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}${path}`;
  }
  /**
   * Retrieves the token to be used for API authentication.
   * If `isBatchMethod` is `true` and the batch token is available, it returns the batch token.
   * Otherwise, it returns the API key from the configuration.
   *
   * @param isBatchMethod - Indicates whether the method is being called for a batch operation.
   * @returns The token to be used for API authentication.
   */
  private getToken(isBatchMethod: boolean = false) {
    // Check if the batch token is available
    if (isBatchMethod && this.batchToken.token) return this.batchToken.token;
    return this.config.apiKey;
  }
  /**
   * Checks the batch token and updates its properties if necessary.
   * Reset the batch token if it has expired and the number of requests exceeds the limit of 200.
   */
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
  /**
   * Checks if a custom ID is valid.
   *
   * @param customId - The custom ID to validate.
   * @returns Returns `true` if the custom ID is valid, otherwise throws an error.
   * @throws Throws an error if the custom ID is invalid.
   */
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
  /**
   * Encodes a UUID string into a Base64 string.
   *
   * @param uuid - The UUID string to encode.
   * @returns The Base64 string representation of the UUID.
   */
  encodeUUID(uuid: string): string {
    // Convert UUID to a byte array (assuming UUID is in standard format)
    const hexBytes = uuid.replace(/-/g, "");
    const buffer = new Uint8Array(hexBytes.length / 2);
    for (let i = 0; i < hexBytes.length; i += 2) {
      buffer[i / 2] = parseInt(hexBytes.substring(i, i + 2), 16);
    }

    // Convert byte array to Base64 string
    let base64String = btoa(
      String.fromCharCode.apply(null, Array.from(buffer))
    );
    base64String = base64String.replace(/\+/g, "_").replace(/\//g, "~");
    return base64String;
  }
  /**
   * Decodes a Base64 encoded string into a UUID format.
   * @param encoded - The Base64 encoded string to decode.
   * @returns The decoded UUID string.
   */
  decodeUUID(encoded: string): string {
    encoded = encoded.replace(/_/g, "+").replace(/~/g, "/");
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

    return uuid.substring(0, 36);
  }
  /**
   * Handles the response from an HTTP request and parses the data using the provided parser function.
   * @param response - The response object from the HTTP request.
   * @param parser - A function that takes an unknown value and returns a parsed value of type T.
   * @returns A promise that resolves to the parsed data of type T.
   * @throws An error with the response status text if the response is not OK.
   */
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
  /**
   * Validates an image file.
   * @param file - The image file to validate.
   * @returns A promise that resolves to a boolean indicating whether the image is valid.
   * @throws An error if the file size exceeds the maximum limit of 10 MB or if the image format is unsupported.
   */
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
  /**
   * Uploads an image.
   *
   * @param url - The URL of the image to upload.
   * @param customId - Optional. A custom ID for the image.
   * @param metadata - Optional. Additional metadata for the image.
   * @param requireSignedURLs - Optional. Indicates whether signed URLs are required for the image.
   * @returns A Promise that resolves to the response of the image upload, or null if there was an error.
   */
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
  /**
   * Uploads an image file.
   *
   * @param file - The image file to upload.
   * @param customId - Optional. A custom ID for the uploaded image.
   * @param metadata - Optional. Additional metadata for the uploaded image.
   * @param requireSignedURLs - Optional. Indicates whether signed URLs are required for the upload.
   * @returns A Promise that resolves to the response of the upload operation, or null if an error occurs.
   */
  async uploadImageWithFile(
    file: File,
    customId: string | null = null,
    metadata: Record<string, any> = {},
    requireSignedURLs: boolean = false
  ): Promise<UploadImageResponseSchema | null> {
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
  /**
   * Uploads an image with a buffer to the Cloudflare Images API.
   *
   * @param buffer - The image buffer to upload.
   * @param filename - The name of the file.
   * @param customId - (Optional) The custom ID for the image.
   * @param metadata - (Optional) Additional metadata for the image.
   * @param requireSignedURLs - (Optional) Indicates whether signed URLs are required for the image.
   * @returns A promise that resolves to the response from the API, or null if there was an error.
   */
  async uploadImageWithBuffer(
    buffer: Buffer,
    filename: string,
    customId: string | null = null,
    metadata: Record<string, any> = {},
    requireSignedURLs: boolean = false
  ): Promise<UploadImageResponseSchema | null> {
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
  /**
   * Retrieves a list of images from the Cloudflare Images API.
   *
   * @param page - The page number of the results to retrieve. Defaults to 1.
   * @param perPage - The number of results per page to retrieve. Defaults to 1000.
   * @returns A Promise that resolves to a ListImagesResponseSchema object or null if an error occurs.
   */
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
  /**
   * Retrieves the usage statistics for the Cloudflare Images API.
   * @returns A Promise that resolves to the usage statistics response or null if an error occurs.
   */
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
  /**
   * Retrieves the full list of images.
   * @returns A promise that resolves to an array of image or null if an error occurs.
   */
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
  /**
   * Deletes an image with the specified ID.
   * @param id - The ID of the image to delete.
   * @returns A Promise that resolves to a boolean indicating whether the image was successfully deleted.
   */
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
  /**
   * Retrieves the details of an image with the specified ID.
   * @param id - The ID of the image to retrieve details for.
   * @returns A Promise that resolves to the image details, or null if an error occurred.
   */
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
  /**
   * Updates an image with the specified ID.
   *
   * @param id - The ID of the image to update.
   * @param metadata - Optional metadata to update the image with.
   * @param requireSignedURLs - Optional flag indicating whether signed URLs are required for the image.
   * @returns A Promise that resolves to the updated image response, or null if an error occurs.
   */
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
  /**
   * Retrieves the base image with the specified ID.
   * @param id - The ID of the base image.
   * @returns A Promise that resolves to a Blob representing the base image, or null if the image is not found.
   */
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
  /**
   * Refreshes the batch token.
   * If the request is successful, updates the batch token with the new token and expiration time.
   *
   * @returns A boolean indicating whether the batch token was successfully refreshed.
   */
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
