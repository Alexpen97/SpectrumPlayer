# Spotify Clone Project

A full-stack Spotify clone application with a Spring Boot backend (API) and React Electron frontend (UI).

## Project Structure

The project is divided into two main components:

### 1. spotify-api (Spring Boot Backend)

The backend provides a RESTful API for managing music data and integrates with the Lidarr API for fetching music metadata.

- **Java Version**: 17
- **Framework**: Spring Boot 3.2.0
- **Database**: H2 (in-memory)
- **Features**: 
  - RESTful API for Artists, Albums, Tracks, Genres, and Playlists
  - Lidarr API integration for music metadata
  - H2 in-memory database with sample data for development
  - Cross-origin resource sharing (CORS) support

### 2. spotify-ui (React Electron Frontend)

The frontend provides a user interface similar to Spotify, packaged as a desktop application using Electron.

- **Framework**: React 18
- **Desktop Integration**: Electron
- **Features**:
  - Modern UI similar to Spotify
  - Music playback controls
  - Library management
  - Playlist creation and management
  - Search functionality

## Setup and Installation

### Prerequisites

- Java 17 or higher
- Node.js 16 or higher
- npm 8 or higher
- Lidarr instance (optional, for extended music metadata)

### Running the Backend (Spring Boot)

1. Navigate to the `spotify-api` directory:
   ```
   cd spotify-api
   ```

2. Build the application using Maven:
   ```
   ./mvnw clean package
   ```

3. Run the application:
   ```
   ./mvnw spring-boot:run
   ```

4. The API will be available at `http://localhost:8080`
   - H2 Console: `http://localhost:8080/h2-console`
   - API Base URL: `http://localhost:8080/api`

### Running the Frontend (React Electron)

1. Navigate to the `spotify-ui` directory:
   ```
   cd spotify-ui
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the application in development mode:
   ```
   npm run electron-dev
   ```

4. For building the desktop application:
   ```
   npm run electron-pack
   ```

## API Endpoints

### Artists

- `GET /api/artists` - Get all artists
- `GET /api/artists/{id}` - Get artist by ID
- `GET /api/artists/search?name={name}` - Search artists by name
- `POST /api/artists` - Create a new artist
- `PUT /api/artists/{id}` - Update an artist
- `DELETE /api/artists/{id}` - Delete an artist
- `GET /api/artists/lidarr/{lidarrId}` - Get artist details from Lidarr
- `GET /api/artists/lidarr/search?term={term}` - Search artists in Lidarr
- `POST /api/artists/sync/lidarr` - Sync artists from Lidarr

### Albums

- `GET /api/albums` - Get all albums
- `GET /api/albums/{id}` - Get album by ID
- `GET /api/albums/artist/{artistId}` - Get albums by artist ID
- `GET /api/albums/search?title={title}` - Search albums by title
- `POST /api/albums` - Create a new album
- `PUT /api/albums/{id}` - Update an album
- `DELETE /api/albums/{id}` - Delete an album
- `GET /api/albums/lidarr/{lidarrAlbumId}` - Get album details from Lidarr
- `POST /api/albums/sync/artist/{artistId}` - Sync albums for an artist from Lidarr

### Tracks

- `GET /api/tracks` - Get all tracks
- `GET /api/tracks/{id}` - Get track by ID
- `GET /api/tracks/search/title?query={query}` - Search tracks by title
- `GET /api/tracks/artist/{artistId}` - Get tracks by artist ID
- `GET /api/tracks/album/{albumId}` - Get tracks by album ID
- `POST /api/tracks` - Create a new track
- `PUT /api/tracks/{id}` - Update a track
- `DELETE /api/tracks/{id}` - Delete a track
- `GET /api/tracks/sync/artist/{artistId}` - Sync tracks for an artist from Lidarr

### Genres

- `GET /api/genres` - Get all genres
- `GET /api/genres/{id}` - Get genre by ID
- `GET /api/genres/search?name={name}` - Search genres by name
- `POST /api/genres` - Create a new genre
- `PUT /api/genres/{id}` - Update a genre
- `DELETE /api/genres/{id}` - Delete a genre

### Playlists

- `GET /api/playlists` - Get all playlists
- `GET /api/playlists/{id}` - Get playlist by ID
- `GET /api/playlists/user/{username}` - Get playlists by owner
- `GET /api/playlists/public` - Get public playlists
- `GET /api/playlists/search?name={name}` - Search playlists by name
- `POST /api/playlists` - Create a new playlist
- `PUT /api/playlists/{id}` - Update a playlist
- `POST /api/playlists/{playlistId}/tracks/{trackId}` - Add a track to a playlist
- `DELETE /api/playlists/{playlistId}/tracks/{trackId}` - Remove a track from a playlist
- `DELETE /api/playlists/{id}` - Delete a playlist

## Lidarr Integration

The application can integrate with Lidarr for enhanced music metadata. Configure the Lidarr connection in `application.properties`:

```properties
lidarr.baseUrl=http://192.168.0.103:8686/api/v1
lidarr.apiKey=759365b6a6cd444d9d38734199169f0f
```

Replace with your Lidarr instance details.

## Development

### Spring Boot Backend

- Models are in `com.example.spotifyapi.model`
- Repositories are in `com.example.spotifyapi.repository`
- Services are in `com.example.spotifyapi.service`
- Controllers are in `com.example.spotifyapi.controller`
- Lidarr client is in `com.example.spotifyapi.lidarr`

### React Electron Frontend

- Components are in `src/components`
- Pages are in `src/pages`
- Styles are in `src/styles`
- Services (API clients) are in `src/services`
- Electron configuration is in `public/electron.js`

## License

This project is for educational purposes only and is not affiliated with Spotify or Lidarr.
