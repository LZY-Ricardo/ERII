## ADDED Requirements
### Requirement: Sticky Article Catalog
The blog article page SHALL keep the desktop article catalog visible while the reader scrolls through a long article.

#### Scenario: Reader scrolls a long article on desktop
- **WHEN** the article page includes a chapter catalog in the right sidebar
- **THEN** the catalog widget remains visible within the viewport while the page scrolls
- **AND** the widget does not cover the main navbar or overlap the article body

### Requirement: Clickable Chapter Navigation
The blog article page SHALL provide clickable chapter entries that jump to the corresponding heading in the article body.

#### Scenario: Reader clicks a chapter entry
- **WHEN** the reader clicks a chapter item in the article catalog
- **THEN** the page scrolls to the matching article heading
- **AND** the URL fragment reflects the current chapter anchor

### Requirement: Stable Heading Anchors
The blog article page SHALL generate stable anchors for rendered headings so chapter links continue to work across refreshes.

#### Scenario: Article contains repeated or nested headings
- **WHEN** the article content is rendered into headings for the catalog
- **THEN** each catalog entry maps to a unique heading anchor
- **AND** the generated anchor remains deterministic for the same heading order

### Requirement: Article Detail Sidebar Focus
The blog article detail page SHALL keep the desktop right sidebar focused on in-article reading aids only.

#### Scenario: Reader opens an article detail page
- **WHEN** the desktop article detail layout is rendered
- **THEN** the right sidebar only shows cards related to the current article reading flow
- **AND** the article catalog remains available as the second card in the sidebar

### Requirement: Recent Article Comments Preview
The blog article detail page SHALL display a recent comments preview card for the current article in the desktop right sidebar.

#### Scenario: Article has approved comments
- **WHEN** the article detail page is rendered with recent approved comments
- **THEN** the sidebar shows a "最近评论" card before the article catalog
- **AND** each comment preview includes enough information for the reader to identify the comment
- **AND** the reader can jump from the preview to the corresponding comment in the page

#### Scenario: Article has no approved comments
- **WHEN** the article detail page is rendered without recent approved comments
- **THEN** the sidebar still shows the "最近评论" card
- **AND** the card displays an empty state instead of hiding completely
