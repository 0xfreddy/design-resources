export async function selectionAsync() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function" && navigator.userActivation?.hasBeenActive) {
    navigator.vibrate(8)
  }
}
