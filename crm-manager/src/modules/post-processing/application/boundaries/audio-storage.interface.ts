export interface IAudioStorage {
  /**
   * Returns a public (signed) URL for the given S3 object key.
   * @param key S3 object key
   */
  getPublicUrl(key: string): Promise<string>;
}
