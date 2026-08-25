"use server";

import { cookies } from "next/headers";
import { apiClient } from "@/client/api-client";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
} from "@/constants/auth";
import { getApiErrorMessage } from "@/lib/api-error";
import type { components } from "@/types/api.generated";
import type { ActionResult } from "@/types/server-action";

export type SignupInput = components["schemas"]["SignupRequest"];
export type LoginInput = components["schemas"]["LoginRequest"];
export type AuthResponse = components["schemas"]["AuthResponseDto"];
export type ClinicProfile = components["schemas"]["ClinicDto"];

/**
 * Server Action: Register a new clinic account
 */
export async function signupAction(
  input: SignupInput,
): Promise<ActionResult<AuthResponse>> {
  try {
    const { data, error, response } = await apiClient.POST("/auth/signup", {
      body: input,
    });

    if (error || !data) {
      const errorMessage = getApiErrorMessage(
        error,
        `Signup failed with status ${response.status}`,
      );
      return { success: false, error: errorMessage };
    }

    // Persist JWT token in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(ACCESS_TOKEN_COOKIE, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred during signup",
    };
  }
}

/**
 * Server Action: Authenticate existing clinic
 */
export async function loginAction(
  input: LoginInput,
): Promise<ActionResult<AuthResponse>> {
  try {
    const { data, error, response } = await apiClient.POST("/auth/login", {
      body: input,
    });

    if (error || !data) {
      const errorMessage = getApiErrorMessage(
        error,
        response.status === 401
          ? "Invalid username or password"
          : `Login failed with status ${response.status}`,
      );
      return { success: false, error: errorMessage };
    }

    // Persist JWT token in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(ACCESS_TOKEN_COOKIE, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred during login",
    };
  }
}

/**
 * Server Action: Clear session and logout
 */
export async function logoutAction(): Promise<ActionResult<null>> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    return { success: true, data: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to logout",
    };
  }
}

/**
 * Server Action: Fetch authenticated clinic profile
 */
export async function getMeAction(): Promise<ActionResult<ClinicProfile>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error, response } = await apiClient.GET("/clinics/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (error || !data) {
      return {
        success: false,
        error: getApiErrorMessage(
          error,
          `Failed to fetch profile (${response.status})`,
        ),
      };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch profile",
    };
  }
}
