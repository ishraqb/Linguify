# Linguify - Requirements & User Stories (Project 3)

## User Types

- Visitor - not logged in yet.
- Learner - a logged-in user studying a language through songs.
- Free listener - a Learner without Spotify Premium.
- Premium listener - a Learner with Spotify Premium.

## Functional Requirements

- The system shall let a user log in with their Spotify account via OAuth.
- The system shall let a Learner search for songs and view recently played tracks.
- The system shall fetch and display song lyrics with line-by-line translation.
- The system shall automatically detect the source language of a song's lyrics.
- The system shall play audio for a song: a 30-second preview for free users and the full
  song for Premium users via the Spotify Web Playback SDK.
- The system shall highlight the current lyric line in time with the playing audio.
- The system shall let a Learner save a word with its translation, a dictionary definition,
  and spoken pronunciation.
- The system shall let a Learner review saved words as flash cards organized by language.
- The system shall support multiple source and target languages.
- The system shall offer YouTube as an alternative music source.
- The system shall be responsive and usable on mobile devices.
- The system shall be deployed to a public URL and run its tests automatically in CI.

## Epics & User Stories

### Epic 1: Authentication
- As a Visitor, I should be able to log in with my Spotify account, so that I can access
  my music and save my progress.
- As a Learner, I should be able to log out, so that my session ends securely.

### Epic 2: Find Music
- As a Learner, I should be able to search for a song by title or artist, so that I can pick
  what to study.
- As a Learner, I should be able to see my recently played tracks, so that I can quickly
  start a lesson with a familiar song.

### Epic 3: Synced Lyrics + Playback (flagship)
- As a Learner, I should be able to hear the song play while the current lyric line
  highlights in time with the music, so that I can follow along and connect words to sound.
- As a Free listener, I should be able to play a 30-second preview, so that I can still use
  synced lyrics without Premium.
- As a Premium listener, I should be able to play the full song, so that I can study the
  entire track.
- Acceptance criteria:
  - Lyrics display line by line with the active line visually highlighted.
  - The active line advances automatically based on the audio's current time.
  - Playback controls (play/pause) work for both preview and full-song modes.
  - If timestamps are unavailable, the user can still advance lines manually.

### Epic 4: Translation & Language
- As a Learner, I should be able to see each lyric line translated into my target language,
  so that I understand the song.
- As a Learner, I should be able to have the song's language detected automatically, so that
  I don't have to select it manually.
- As a Learner, I should be able to override the detected language, so that I can correct it
  when it's wrong.
- As a Learner, I should be able to choose from multiple target languages, so that I can
  study in the language I'm learning.

### Epic 5: Vocabulary
- As a Learner, I should be able to tap a word in the lyrics to save it, so that I can review
  it later.
- As a Learner, I should be able to see a real dictionary definition for a saved word, so
  that I understand its meaning beyond a direct translation.
- As a Learner, I should be able to hear a word pronounced aloud, so that I learn to say it
  correctly.
- As a Learner, I should be able to review my saved words as flash cards organized by
  language, so that I can study one language at a time.
- As a Learner, I should be able to delete a saved word, so that I can keep my list relevant.
- Acceptance criteria:
  - Saving a word stores its translation, definition, and target language.
  - A word card shows the word, translation, definition, and a pronunciation button.
  - Flash card review can be filtered/grouped by language.

### Epic 6: Alternative Music Source (YouTube)
- As a Learner, I should be able to find and play a song from YouTube, so that I can study
  tracks not available or playable on Spotify.

### Epic 7: Experience & Access
- As a Learner, I should be able to use the app comfortably on my phone, so that I can study
  on the go.
- As a Learner, I should be able to navigate a clean, consistent interface, so that the app
  is easy and pleasant to use.

## Backlog (post-MVP)

- As a Learner, I should be able to see the slang/contextual meaning of a word within the
  song, so that I understand casual usage.
- As a Learner, I should be able to export my saved words to Anki, so that I can study them
  in my existing flashcard app.
- As a Visitor, I should be able to try a demo without logging in, so that I can evaluate the
  app first.
- As a Learner, I should be able to control whether explicit lyrics are shown, so that I can
  avoid content I don't want to see.
- As a Learner, I should be able to play music from SoundCloud or Apple Music, so that I have
  more source options.