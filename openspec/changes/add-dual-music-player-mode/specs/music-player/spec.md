## MODIFIED Requirements
### Requirement: Dual Music Player Modes
The system SHALL provide Spotify as the only in-page music player mode in the blog music interfaces.

#### Scenario: Dock renders Spotify player
- **WHEN** the user opens the dock player
- **THEN** the player content uses Spotify embedded playback without offering a local mode switch

#### Scenario: Music page renders Spotify player
- **WHEN** the user opens `/music`
- **THEN** the page uses Spotify embedded playback without offering a local mode switch

### Requirement: Spotify-Only Playable Content
The system SHALL show only Spotify playlists as in-page playable content.

#### Scenario: Playable list is filtered
- **WHEN** the music player UI renders
- **THEN** only Spotify playlists are shown as in-page playable entries
