export function buildQuickProjectPayload(project, patch = {}) {
  return {
    id: project.id,
    name: project.name,
    tagline: project.tagline ?? "",
    summary: project.summary ?? "",
    status: project.status ?? "",
    state: project.state ?? "active",
    focus: project.focus ?? [],
    tech: project.tech ?? [],
    cover: project.cover ?? "",
    featured: project.featured ?? false,
    links: project.links ?? [],
    sortOrder: project.sortOrder ?? 0,
    ...patch,
  };
}

export function applyQuickProjectPatch(projects, projectId, patch = {}) {
  return projects.map((project) =>
    project.id === projectId ? { ...project, ...patch } : project
  );
}

function swapFeaturedProjectSortOrder(projects, currentProject, swappedProject) {
  return {
    changedIds: [currentProject.id, swappedProject.id],
    projects: projects.map((project) => {
      if (project.id === currentProject.id) {
        return { ...project, sortOrder: swappedProject.sortOrder ?? 0 };
      }
      if (project.id === swappedProject.id) {
        return { ...project, sortOrder: currentProject.sortOrder ?? 0 };
      }
      return project;
    }),
  };
}

export function moveFeaturedProject(projects, projectId, direction) {
  const featuredProjects = projects
    .filter((project) => project.featured)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const currentIndex = featuredProjects.findIndex((project) => project.id === projectId);
  if (currentIndex === -1) return { projects, changedIds: [] };

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= featuredProjects.length) {
    return { projects, changedIds: [] };
  }

  const currentProject = featuredProjects[currentIndex];
  const swappedProject = featuredProjects[targetIndex];

  return swapFeaturedProjectSortOrder(projects, currentProject, swappedProject);
}

export function assignFeaturedProjectSlot(projects, projectId, slot) {
  const featuredProjects = projects
    .filter((project) => project.featured)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const currentProject = featuredProjects.find((project) => project.id === projectId);
  const swappedProject = featuredProjects[slot - 1] ?? null;

  if (!currentProject || !swappedProject || currentProject.id === swappedProject.id) {
    return { projects, changedIds: [] };
  }

  return swapFeaturedProjectSortOrder(projects, currentProject, swappedProject);
}
