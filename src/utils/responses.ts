import { NextResponse } from 'next/server';

export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
};

export const createResponse = <T>(
  success: boolean,
  message: string,
  data: T | null = null,
  error: string | null = null,
  status: number = 200
) => {
  return NextResponse.json(
    {
      success,
      message,
      data,
      error,
    },
    { status }
  );
};

export const successResponse = <T>(data: T, message: string = 'Success') => {
  return createResponse(true, message, data, null, 200);
};

export const createdResponse = <T>(data: T, message: string = 'Created') => {
  return createResponse(true, message, data, null, 201);
};

export const errorResponse = (error: string, status: number = 400) => {
  return createResponse(false, 'An error occurred', null, error, status);
};

export const unauthorizedResponse = (message: string = 'Unauthorized') => {
  return createResponse(false, 'Unauthorized access', null, message, 401);
};

export const forbiddenResponse = (message: string = 'Forbidden') => {
  return createResponse(false, 'Access denied', null, message, 403);
};

export const notFoundResponse = (message: string = 'Resource not found') => {
  return createResponse(false, 'Not found', null, message, 404);
};
