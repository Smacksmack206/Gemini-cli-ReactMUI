# Gemini CLI Web App

A modern web-based Command-Line Interface (CLI) assistant powered by Google Gemini (Generative AI), built with React, Material-UI, Node.js Express backend, and Firebase authentication. The app provides an interactive terminal interface in the browser, supporting Dockerized deployment and secure authentication.

---

## Features

- **AI-Powered CLI Experience:** Gemini responds to user commands as a terminal, executing shell commands when appropriate and responding directly to recognized commands.
- **Authentication:** Supports Firebase authentication with email/password, anonymous mode, and user signup.
- **Modern UI:** Built with Material-UI (MUI) and a dark theme for an appealing, responsive interface.
- **Dockerized Deployment:** Quickly switch between Docker and Local terminal environments at the click of a button. Both frontend and backend are containerized for easy development, deployment, and scalability.
- **Secure Handling of Secrets:** `.env` files are ignored by Git by default, and `.env.example` is provided for reference.
- **Customizable:** Easy to extend for additional command support, model configurations, or UI features.

---

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Yarn](https://yarnpkg.com/) (or npm)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- A [Firebase project](https://firebase.google.com/) for authentication
- A [Google Gemini API Key](https://ai.google.dev/) (for Generative AI features)

### 1. Clone the Repository

```sh
git clone git@github.com:Smacksmack206/Gemini-cli-ReactMUI.git
cd Gemini-cli-ReactMUI/gemini-cli-web
```

### 2. Configure Environment Variables

Create a `.env` file in both `backend/` and frontend root (see `.env.example` for references):

**Backend `.env`:**
```
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_API_KEY=your_firebase_api_key
...
```

**Frontend `.env`:**
```
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
...
```

> _Do **not** commit actual `.env` files; the setup script ensures `.env` is listed in `.gitignore`._

### 3. Install Dependencies

Frontend and backend dependencies are managed with Yarn:

```sh
# Frontend
yarn install

# Backend
cd backend
yarn install
```

### 4. Dockerized Development

Build and run both frontend and backend via Docker Compose:

```sh
docker-compose up --build
```

- Frontend runs on port 3000
- Backend runs on port 3001

### 5. Local Development (without Docker)

You can run apps separately:

```sh
# Backend
cd backend
npm start

# Frontend
cd ..
yarn start
```

---

## Usage

- Open the web app in your browser (`http://localhost:3000`)
- Login or sign up using Firebase authentication
- Enter CLI commands in the terminal interface; Gemini will respond and may execute shell commands via the backend.
- If a command is not recognized, Gemini will respond with: `Command not found: [command]`.

---

## Project Structure

```
Gemini-cli-ReactMUI/
├── backend/           # Node.js Express backend with Gemini API integration
│   ├── server.js
│   ├── Dockerfile
│   └── .env.example
├── src/               # React frontend
│   ├── App.js
│   └── ...
├── Dockerfile         # Multi-stage Docker build for frontend
├── docker-compose.yml # Orchestration for frontend & backend
└── gitreposetup.sh    # Script for initial repo setup
```

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License.

---

## Author

Cedric Vallieu
[Smacksmack206 on GitHub](https://github.com/Smacksmack206)
[Cedric Vallieu](https://www.linkedin.com/in/cedric-signifyd/)

---

## Troubleshooting

- **Docker Issues:** Ensure Docker and Docker Compose are installed and running. If you encounter port conflicts, change the default ports in `docker-compose.yml`.
- **API Key Errors:** Double-check your `.env` files for correct Gemini and Firebase API keys.
- **Authentication Problems:** Ensure Firebase project settings are correct and enabled for email/password auth.

---

## Credits

- [Google Generative AI (Gemini)](https://ai.google.dev/)
- [Firebase](https://firebase.google.com/)
- [Material UI](https://mui.com/)
- [React](https://react.dev/)
