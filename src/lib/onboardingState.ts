const key = "redux-ai-onboarding-complete";

export function shouldShowOnboarding(hasProject: boolean, force = false) {
  if (force) return true;
  if (!hasProject) return true;
  return localStorage.getItem(key) !== "yes";
}

export function completeOnboarding() {
  localStorage.setItem(key, "yes");
}

export function resetOnboarding() {
  localStorage.removeItem(key);
}
