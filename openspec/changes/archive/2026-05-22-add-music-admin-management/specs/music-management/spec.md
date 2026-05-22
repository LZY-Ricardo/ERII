## ADDED Requirements

### Requirement: Admin Music Catalog Management
The system SHALL provide an admin music management interface for maintaining shared playlists across supported platforms.

#### Scenario: Admin lists managed playlists
- **WHEN** an authenticated admin opens the music management page
- **THEN** the system shows the saved playlist entries with platform, publish state, embedded-player eligibility, and sort order

#### Scenario: Admin creates a playlist entry
- **WHEN** an authenticated admin submits a valid playlist form
- **THEN** the system stores the playlist in the database and makes it available to frontend music views according to its state

#### Scenario: Admin updates or deletes a playlist entry
- **WHEN** an authenticated admin edits or deletes an existing playlist entry
- **THEN** the system persists the change and the frontend reflects the updated catalog on subsequent reads

### Requirement: Multi-Platform Music Sharing
The system SHALL allow `/music` to present published playlists from Spotify, QQ Music, and NetEase Cloud Music as shareable entries.

#### Scenario: Music page shows published playlists
- **WHEN** a visitor opens `/music`
- **THEN** the page renders all published playlist entries in configured order regardless of platform

#### Scenario: Unsupported platforms remain share-only
- **WHEN** a published playlist belongs to QQ Music or NetEase Cloud Music
- **THEN** the page shows its metadata and outbound link without attempting in-page playback

### Requirement: Player Visibility Toggle
The system SHALL provide a configurable switch for turning in-page music playback surfaces on or off without removing the `/music` page itself.

#### Scenario: Player surfaces disabled
- **WHEN** an admin turns off the music player visibility setting
- **THEN** the global dock player and `/music` page in-page player area do not render
- **AND** `/music` still shows playlist cards and external links

#### Scenario: Player surfaces enabled
- **WHEN** an admin turns on the music player visibility setting
- **THEN** eligible in-page player surfaces render according to the available embeddable playlists

### Requirement: Spotify-Only In-Page Playback Eligibility
The system SHALL restrict in-page playback candidates to Spotify playlists explicitly marked as embeddable.

#### Scenario: Dock uses eligible Spotify playlists only
- **WHEN** the dock player resolves its playlist candidates
- **THEN** it uses only published Spotify playlists with embedded playback enabled

#### Scenario: No eligible playlist available
- **WHEN** the player visibility setting is enabled but no playlist satisfies the Spotify embedded criteria
- **THEN** the system does not render the dock player or `/music` page in-page player area
