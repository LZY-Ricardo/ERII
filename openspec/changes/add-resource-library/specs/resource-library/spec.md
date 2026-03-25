## ADDED Requirements
### Requirement: Resource Library Page
The system SHALL provide a dedicated `资源库` page that organizes recommended resources by usage scenario instead of presenting them as standalone advertisements.

#### Scenario: User opens the resource library page
- **WHEN** a user navigates to the `资源库` page
- **THEN** the page displays grouped sections for `AI`, `开发`, `网络`, and `效率`
- **AND** each section presents a curated subset of resources

### Requirement: Resource Recommendation Card
The system SHALL present each resource using a consistent recommendation card that explains why the resource is useful before prompting the user to leave the site.

#### Scenario: User reads a resource card
- **WHEN** a resource card is rendered
- **THEN** it includes the resource name, a short usage summary, a recommendation reason, and an external action button
- **AND** cards with referral relationships clearly disclose that relationship

### Requirement: Resource Library Navigation Entry
The system SHALL expose the resource library through the main site navigation.

#### Scenario: User browses the navbar
- **WHEN** the main navigation is rendered
- **THEN** a `资源库` entry is visible alongside other primary site sections
