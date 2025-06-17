import { PostgrestError } from '@supabase/supabase-js';

export class ApiError extends Error {
  status: number;
  details?: string;
  hint?: string;
  code?: string;

  constructor(message: string, status = 500, details?: string, hint?: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.hint = hint;
    this.code = code;
  }

  static fromSupabaseError(error: PostgrestError): ApiError {
    return new ApiError(
      error.message,
      parseInt(error.code) || 500,
      error.details,
      error.hint,
      error.code
    );
  }

  toObject() {
    return {
      message: this.message,
      status: this.status,
      details: this.details,
      hint: this.hint,
      code: this.code,
    };
  }
}

export const handleApiError = (error: unknown): never => {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    throw error;
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; code?: string };
    throw new ApiError(
      err.message || 'An unknown error occurred',
      err.code ? parseInt(err.code) : 500
    );
  }
  
  throw new ApiError('An unknown error occurred', 500);
};

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const handleSupabaseError = <T>({ data, error }: { data: T | null; error: PostgrestError | null }): T => {
  if (error) {
    throw ApiError.fromSupabaseError(error);
  }
  if (!data) {
    throw new ApiError('No data returned from the server', 404);
  }
  return data;
};
