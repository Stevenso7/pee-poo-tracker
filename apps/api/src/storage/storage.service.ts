import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';

/**
 * Wraps Supabase Storage (private bucket) for photo uploads. Uses the service
 * role key server-side, so access is controlled by this service only.
 */
@Injectable()
export class StorageService {
  private readonly client: SupabaseClient;
  private readonly bucket = 'records';

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_SECRET_KEY');
    if (!url || !key) {
      throw new Error('Supabase configuration is missing (SUPABASE_URL / SUPABASE_SECRET_KEY)');
    }
    this.client = createClient(url, key, {
      auth: { persistSession: false },
      realtime: {
        transport: WebSocket,
      },
    });
  }

  /** Returns a signed PUT URL the client uses to upload directly to Storage. */
  async createUploadUrl(path: string): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(path);
    if (error) {
      throw new Error(`Failed to create upload URL: ${error.message}`);
    }
    return data.signedUrl;
  }

  async delete(path: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([path]);
    if (error) {
      throw new Error(`Failed to delete object: ${error.message}`);
    }
  }

  async download(path: string): Promise<{ data: Blob; contentType: string }> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(path);
    if (error) {
      throw new Error(`Failed to download object: ${error.message}`);
    }
    const blob = data as Blob;
    return { data: blob, contentType: blob.type };
  }

  async createSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);
    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }
    return data.signedUrl;
  }
}
