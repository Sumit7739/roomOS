# RoomOS

RoomOS is a comprehensive web application designed to streamline the management of shared living spaces. It helps roommates coordinate chores, expenses, schedules, and communication in one unified platform.

## Features

- **Dashboard**: Quick overview of current status and notifications.
- **Roster & Planning**: Manage cleaning schedules and shared responsibilities.
- **Crew**: View and manage roommate information.
- **Rules**: Digital handbook for house rules.
- **Money & Transactions**: Track shared expenses and settle debts.
- **Chat**: Built-in messaging for house communication.
- **Profile**: Personal user settings.
- **Theme Support**: Toggle between Light and Dark modes.
- **Offline Support**: Functional even without an internet connection.

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: PHP
- **Database**: MySQL/MariaDB

## Setup & Installation

1.  **Database Setup**
    - Create a MySQL database.
    - Import the schema from `server/database/schema.sql`.

2.  **Backend Configuration**
    - Configure the database connection settings in `server/config/db.php`.

3.  **Running the Application**
    - Host the `web` directory on a web server (e.g., Apache, Nginx).
    - Ensure the PHP backend is accessible.

## Documentation

- [API Reference](docs/API_REFERENCE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)

## Project Structure

- `web/`: Frontend source code (HTML, CSS, JS assets).
- `server/`: Backend source code (PHP Controllers, Database configuration, API endpoints).
