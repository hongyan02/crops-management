import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL } from "@/config/api";

type ApiEnvelope<T> =
  | {
      success: true;
      data: T;
      meta?: Record<string, unknown>;
    }
  | {
      success: false;
      data: null;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };

export type RequestResult<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export class ApiRequestError extends Error {
  status?: number;
  code: string;
  details?: unknown;
  raw?: unknown;

  constructor({
    message,
    status,
    code = "REQUEST_ERROR",
    details,
    raw,
  }: {
    message: string;
    status?: number;
    code?: string;
    details?: unknown;
    raw?: unknown;
  }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.raw = raw;
  }
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

function handleAuthRedirect(status?: number) {
  if (typeof window === "undefined" || !status) {
    return;
  }

  const { pathname } = window.location;

  if (status === 401 && pathname !== "/sign-in") {
    window.location.assign("/sign-in");
    return;
  }

  if (status === 403 && pathname !== "/403") {
    window.location.assign("/403");
  }
}

http.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope<unknown>;

    if (!envelope || typeof envelope !== "object" || !("success" in envelope)) {
      return {
        ...response,
        data: {
          data: response.data,
        } satisfies RequestResult<unknown>,
      };
    }

    if (!envelope.success) {
      handleAuthRedirect(response.status);
      throw new ApiRequestError({
        message: envelope.error.message,
        status: response.status,
        code: envelope.error.code,
        details: envelope.error.details,
        raw: envelope,
      });
    }

    return {
      ...response,
      data: {
        data: envelope.data,
        meta: envelope.meta,
      } satisfies RequestResult<unknown>,
    };
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const envelope = error.response?.data;

    if (envelope && typeof envelope === "object" && "success" in envelope && !envelope.success) {
      handleAuthRedirect(error.response?.status);
      return Promise.reject(
        new ApiRequestError({
          message: envelope.error.message,
          status: error.response?.status,
          code: envelope.error.code,
          details: envelope.error.details,
          raw: envelope,
        }),
      );
    }

    return Promise.reject(
      new ApiRequestError({
        message: error.message || "网络请求失败",
        status: error.response?.status,
        code: error.code ?? "REQUEST_ERROR",
        raw: error,
      }),
    );
  },
);

export async function request<T>(config: AxiosRequestConfig) {
  const response = await http.request<RequestResult<T>>(config);
  return response.data.data;
}

export async function requestWithMeta<T>(config: AxiosRequestConfig) {
  const response = await http.request<RequestResult<T>>(config);
  return response.data;
}

export function get<T>(url: string, config?: Omit<AxiosRequestConfig, "url" | "method">) {
  return request<T>({ ...config, url, method: "GET" });
}

export function getWithMeta<T>(url: string, config?: Omit<AxiosRequestConfig, "url" | "method">) {
  return requestWithMeta<T>({ ...config, url, method: "GET" });
}

export function post<T, TBody = unknown>(
  url: string,
  data?: TBody,
  config?: Omit<AxiosRequestConfig, "url" | "method" | "data">,
) {
  return request<T>({ ...config, url, method: "POST", data });
}

export function put<T, TBody = unknown>(
  url: string,
  data?: TBody,
  config?: Omit<AxiosRequestConfig, "url" | "method" | "data">,
) {
  return request<T>({ ...config, url, method: "PUT", data });
}

export function del<T = null>(url: string, config?: Omit<AxiosRequestConfig, "url" | "method">) {
  return request<T>({ ...config, url, method: "DELETE" });
}

export type RequestConfig = InternalAxiosRequestConfig;
