export type AppPermissionState = PermissionState | "unsupported";

export async function readPermissionState(
  name: "camera" | "geolocation",
): Promise<AppPermissionState> {
  if (
    typeof navigator === "undefined" ||
    !("permissions" in navigator) ||
    typeof navigator.permissions?.query !== "function"
  ) {
    return "unsupported";
  }

  try {
    const status = await navigator.permissions.query({
      name: name as PermissionName,
    });

    return status.state;
  } catch {
    return "unsupported";
  }
}
