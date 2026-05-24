## ADDED Requirements

### Requirement: Public Pages Minimize Critical Client Work
Public content pages SHALL keep non-essential interactive widgets out of the initial critical rendering path.

#### Scenario: Home page first load
- **WHEN** a user loads `/`
- **THEN** the main content, navigation links, featured projects, and post list are rendered without requiring optional widgets such as the music dock, floating promotional prompt, or sidebar settings panel to finish loading.

#### Scenario: Optional widgets load after intent or idle
- **WHEN** a public page includes optional widgets
- **THEN** those widgets are loaded after direct user intent or after the browser has completed the critical first render path.

### Requirement: Public Routes Avoid Unnecessary Initial API Requests
Public pages SHALL avoid client-side initial API requests for data that is not needed to render visible first-viewport content.

#### Scenario: Sidebar project data
- **WHEN** a user loads a non-article public route
- **THEN** the page does not issue an initial client-side `/api/projects` request solely for an optional sidebar widget.

#### Scenario: Music dock data
- **WHEN** a user loads a public route other than `/music`
- **THEN** music catalog data is not fetched before the dock is visible or requested by user interaction.

### Requirement: Project Listing Uses Single Render-Scoped Data Source
The projects listing page SHALL avoid duplicate database reads for the same project collection during a single render.

#### Scenario: All projects view
- **WHEN** `/projects` renders without a focus filter
- **THEN** the route obtains the project collection once and derives the visible list and total count from that result.

#### Scenario: Filtered projects view
- **WHEN** `/projects?focus=<value>` renders with a valid focus filter
- **THEN** the route avoids fetching all projects and filtered projects as independent database reads unless a documented query strategy proves it is faster.

### Requirement: Article Content Remains Server-Rendered
Article pages SHALL keep primary article content available in server-rendered HTML.

#### Scenario: Article page load
- **WHEN** a user loads `/blog/[slug]`
- **THEN** the article heading, metadata, and body are present without waiting for comments, sharing controls, or optional shell widgets to hydrate.

### Requirement: Asset Budgets Are Enforced For Public Visuals
Public visual assets SHALL be reviewed against explicit size budgets before being used in first-load surfaces.

#### Scenario: Project cover image
- **WHEN** a project cover is used on `/` or `/projects`
- **THEN** the source asset is compressed or replaced when it materially exceeds the documented project cover budget.

#### Scenario: Decorative motion
- **WHEN** a user has reduced-motion preferences enabled
- **THEN** decorative continuous animations are disabled or reduced.

### Requirement: Performance Work Is Verifiable
Performance optimizations SHALL include reproducible build and browser verification.

#### Scenario: Build verification
- **WHEN** performance changes are complete
- **THEN** `pnpm build` succeeds and the resulting route table and client artifacts are reviewed.

#### Scenario: Browser verification
- **WHEN** public routes are checked after optimization
- **THEN** desktop and mobile views show usable first content, working navigation, no incoherent text overlap, and no critical interaction blocked by optional widgets.
