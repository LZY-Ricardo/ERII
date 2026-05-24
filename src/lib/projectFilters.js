import { PROJECT_FOCUS } from "./projectConstants.js";

export function filterProjectCollectionByFocus(projects = [], focus = "all") {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeFocus = String(focus ?? "all");
  const isValidFocus = PROJECT_FOCUS.some((item) => item.value === safeFocus);

  if (!isValidFocus || safeFocus === "all") {
    return safeProjects;
  }

  return safeProjects.filter((project) => {
    const projectFocus = project?.focus;
    if (Array.isArray(projectFocus)) return projectFocus.includes(safeFocus);
    return String(projectFocus ?? "") === safeFocus;
  });
}
