# Reiverr v1

![Stargazers](https://img.shields.io/github/stars/GamerMine/reiverr)
![GitHub issues](https://img.shields.io/github/issues/GamerMine/reiverr)

Reiverr is a project that aims to create a single UI for interacting with TMDB, Jellyfin, Radarr and Sonarr, as well as be an alternative to Overseerr.
This is a fork of Reiverr v1 which was no longer developped in favor of a v2, made for connected TVs. The original project was being developped by [aleksilassila](https://github.com/aleksilassila).

If you need something that will work well on TVs, I encourage you to check out the [original project](https://github.com/aleksilassila/reiverr).

This project is not ready for production uses. Many features are still missing / being tested and changed.

![Demo Video](images/reiverr-demo.gif)

# List of major features

TMDB Discovery:

- Discover trending movies and TV shows
- Browse movies and TV shows by genre or network
- View details about movies and TV shows, such as cast, crew, ratings & trailers.
- Movie & TV show search

Local Library & Playback

- Stream Movies & TV shows (from your Jellyfin library)
- Create requests for movies & TV shows in Radarr & Sonarr
- Manage local library files
- View Radarr & Sonarr stats (disk space, items, etc.)
- Manage Radarr & Sonarr queue from Reiverr
- Support for SyncPlay

### Manual Instructions

1. Requirements:
   - Node v23.11.0 or greater
   - NPM 10.9.2 or greater
2. Clone the repository
3. Build the app:
   ```sh
   npm install
   npm run build
   ```
4. Start the app:
   ```sh
   npm run deploy
   ```

### Reiverr will be accessible via port 9494 by default.

If you have any questions or run into issues or bugs, you can start a [discussion](https://github.com/GamerMine/reiverr/discussions), or open an [issue](https://github.com/GamerMine/reiverr/issues).

# Development

To get started with development:

1. Clone the repository
2. Checkout the `main` branch
3. Run `npm install`
4. Run `npm run dev`

Useful resources:

- https://developer.themoviedb.org/reference
- https://api.jellyfin.org/
- https://sonarr.tv/docs/api/
- https://radarr.video/docs/api/
- https://github.com/jellyfin/jellyfin-web

# Additional Screenshots

![Library Page](images/screenshot-1.png)

![Discover Genre Page](images/screenshot-2.png)

![Discover Page](images/screenshot-3.png)

![Settings Page](images/screenshot-4.png)
