# Supplier Consumer Platform (SCP)

This is the repository for the Supplier Consumer Platform (SCP), a B2B web application designed to streamline collaboration between food suppliers and institutional consumers.

## Technology Stack

-   **Frontend:** Next.js with TypeScript and Tailwind CSS
-   **Backend:** FastAPI (Python)
-   **Database:** PostgreSQL
-   **Mobile:** React Native with Expo (WebView)
-   **Containerization:** Docker

## Prerequisites

-   Docker
-   Docker Compose
-   If you are on Windows, it is recommended to use Docker with the WSL 2 backend.
-   Node.js & npm
-   Expo Go (for mobile app)
-   Android device

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### 1. Clone the repository

```bash
git clone https://github.com/saendodo/scp.git
cd scp
```

### 2. Environment Variables

This project uses environment variables for configuration. Create the following files with the specified content.

**Backend Environment (`backend/.env`)**

Rename a file named `.env.example` to `.env` in the `backend` directory with the following content. Or create a new `.env` with the following content:
```
DATABASE_URL=postgresql://user:password@scp_db:5432/scp_db
SECRET_KEY=your_super_secret_key
```

**Frontend Environment (`frontend/.env`)**

Rename a file named `.env.example` to `.env` in the `frontend` directory. Or create a new `.env` with the following content:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Important:** When deploying or running the backend on a different host/IP address, update `NEXT_PUBLIC_API_URL` in `frontend/.env` to match the IP address where the backend is hosted. For example, if your backend is running on `http://192.168.1.100:8000`, update the value accordingly.

**Mobile Environment (`mobile/.env`)**

Create a `.env` file in the `mobile` directory (next to `package.json`) with the following content:
```
EXPO_PUBLIC_FRONTEND_URL=http://localhost:3000
```

**Important:** Configure `EXPO_PUBLIC_FRONTEND_URL` to point to the URL where your frontend is hosted. For example:
- If running locally: `http://localhost:3000`
- If running on a network IP: `http://192.168.1.100:3000`
- If deployed: `https://your-frontend-domain.com`

Expo automatically loads `.env` files and exposes any variables prefixed with `EXPO_PUBLIC_` to the JavaScript runtime. After updating the value, restart Metro bundler for the changes to take effect.

<details>
<summary><strong>Finding Your IP Address</strong></summary>

To configure the frontend and mobile app to connect to services running on your local network, you'll need to know your machine's IP address. Use the following commands based on your operating system:

- **Windows:** Open Command Prompt or PowerShell and run:
  ```bash
  ipconfig
  ```
  Look for the IPv4 address under your active network adapter (usually labeled as "IPv4 Address" or "IP Address").

- **macOS:** Open Terminal and run:
  ```bash
  ifconfig
  ```
  Look for the `inet` address under your active network interface (usually `en0` for Wi-Fi or `en1` for Ethernet). It will typically look like `192.168.x.x` or `10.0.x.x`.

- **Linux:** Open Terminal and run:
  ```bash
  ip a
  ```
  Look for the `inet` address under your active network interface (usually `eth0` for Ethernet or `wlan0` for Wi-Fi). It will typically look like `192.168.x.x` or `10.0.x.x`.

Once you have your IP address, use it in the environment variables (e.g., `http://192.168.1.100:8000` for backend or `http://192.168.1.100:3000` for frontend).

</details>

### 3. Build and Run the Application with Docker

To build and run the entire application, use the following command from the root of the project:

```bash
docker-compose up --build
```

### 4. Run Database Migrations

After starting the application for the first time, you will need to run the database migrations to create the necessary tables. Open a new terminal and run the following command to apply migration (there are already migrations in /backend/alembic/versions):

```bash
docker-compose exec backend alembic upgrade head
```

The `upgrade head` command should be run to apply new migrations. To create a new migration (will generate code if you made changes to the models):

```bash
docker-compose exec backend alembic revision --autogenerate -m "Initial migration"
```

### 5. Creating a Platform Administrator (Securely)

To create a `platform_admin` user, you should insert the user directly into the database. This method bypasses the public registration endpoint, ensuring privileged access is controlled.

1.  **Access the PostgreSQL container:**
    ```bash
    docker-compose exec scp_db psql -U user scp_db
    ```
    (Replace `user` and `scp_db` with your database user and name from `backend/.env` if they differ.)

2.  **Insert the admin user:**
    Once in the psql prompt, run the following SQL command. Remember to replace `your_admin_password_hash_here` with a securely hashed password. You can generate a password hash here `https://bcrypt-generator.com/`.

    ```sql
    INSERT INTO users (email, hashed_password, role, supplier_id, consumer_id)
    VALUES ('admin@yourdomain.com', 'your_admin_password_hash_here', 'platform_admin', NULL, NULL);
    ```

3.  **Exit psql:**
    ```sql
    \q
    ```
For example if you want to create an admin with login `admin@scp.com` and password `adminpass` use this command:
```sql
INSERT INTO users (email, hashed_password, role, supplier_id, consumer_id) VALUES ('admin@scp.com', '$2a$12$FmFn5y
F7G7SFduE5/bsrZ.tOAi1KKnyV/beij3ocE1uj8.VHZjHmW', 'platform_admin', NULL, NULL);
```
This method ensures that `platform_admin` accounts are created through a controlled, backend-only process.

### Development Workflow

The application is set up with hot-reloading for both the frontend and backend. Any changes you make to the code in the `frontend` or `backend` directories will automatically trigger a reload of the respective service, so you don't need to restart the Docker containers manually during development.

### Stopping the Application

To stop the application, press `Ctrl + C` in the terminal where `docker-compose` is running, and then run the following command to remove the containers:

```bash
docker-compose down
```

## Mobile App Setup

The mobile app is a React Native application using Expo and WebView to display the frontend web application.

### Running the Mobile App Locally

1. **Navigate to the mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run on Android:**
   ```bash
   npm run android
   ```

Make sure you have configured the `mobile/.env` file with the correct frontend URL as described in the Environment Variables section above.

## Project Structure

```
.
├── backend/            # FastAPI backend application
├── frontend/           # Next.js frontend application
├── mobile/             # React Native mobile application
├── docker-compose.yml  # Docker Compose configuration
└── README.md           # This file
```
