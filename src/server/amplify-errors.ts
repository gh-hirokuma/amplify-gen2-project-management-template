export function getAmplifyErrorMessage(
  errors: unknown,
  fallback = "Unknown data error",
) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return null;
  }

  return errors
    .map((entry) =>
      typeof entry === "object" && entry !== null && "message" in entry
        ? String(entry.message)
        : fallback,
    )
    .join(", ");
}

export function throwIfAmplifyErrors(
  errors: unknown,
  fallback = "Unknown data error",
) {
  const message = getAmplifyErrorMessage(errors, fallback);

  if (message) {
    throw new Error(message);
  }
}
