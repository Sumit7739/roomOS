# RoomOS Developer Guide

## System Architecture

RoomOS is built as a Progressive Web App (PWA) with a decoupled frontend and backend.

### Frontend (`web/`)
- **Technology**: Vanilla JavaScript (ES Modules), HTML5, CSS3.
- **State Management**: Custom store (`store.js`) with reactive state updates.
- **Offline Support**:
  - Service Worker (`sw.js`) caches assets and API responses.
  - `api.js` handles network requests with a fallback to cached data.
  - `queueAction` in `store.js` queues POST/PUT requests when offline for later synchronization.
- **Routing**: Simple hash-based or history API routing (managed in `app.js`).

### Backend (`server/`)
- **Technology**: PHP (Vanilla, no framework).
- **Database**: MySQL / MariaDB.
- **Structure**:
  - `public/`: Entry point (likely `index.php` routing requests to controllers).
  - `src/Controllers/`: Logic for handling API requests.
  - `config/`: Database connection configuration.
  - `database/`: SQL schemas and migrations.

## Database Schema

The database consists of the following core tables:

- **Users & Groups**:
  - `users`: Stores user credentials and profile info.
  - `groups`: Represents a household or shared living space.
  - `join_requests`: Manages invites/requests to join groups.

- **Features**:
  - `roster`: Stores cleaning/duty schedules per day.
  - `tasks`: Ad-hoc tasks assigned to the group.
  - `transactions`: Financial records of expenses.
  - `balances`: Tracks how much each user owes or is owed.
  - `chat_messages`: History of group chat.
  - `user_schedules`: Personal weekly availability.

- **System**:
  - `sessions`: API authentication tokens.
  - `device_tokens`: Push notification tokens.

## Setup for Development

1.  **Prerequisites**:
    - PHP 7.4+
    - MySQL/MariaDB
    - Web Server (Apache/Nginx) or PHP built-in server.

2.  **Database**:
    - Create a database named `roomos` (or similar).
    - Import `server/database/schema.sql`.

3.  **Configuration**:
    - Edit `server/config/db.php` with your database credentials.

4.  **Running**:
    - Serve the `web` folder for the frontend.
    - Serve the `server` folder for the backend.
    - Update `API_BASE` in `web/js/api.js` to point to your local backend URL.

## Key Concepts

### Offline-First
The application is designed to work offline.
- **Reads**: `apiCall` in `api.js` tries the network first. If it fails, it retrieves data from the cache (IndexedDB or LocalStorage via `store.js`).
- **Writes**: If the network is unavailable, write actions are added to a sync queue. The `sync.js` module attempts to flush this queue when the connection is restored.

### Transaction Logic
Expenses are tracked using a "split" model.
- When a user adds a transaction, `TransactionController` calculates the split.
- It updates the `balances` table for each involved user.
- Balances are relative: Positive means the group owes the user; Negative means the user owes the group.
