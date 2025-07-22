#!/bin/bash

# Define the project directory name and desired GitHub repo name
PROJECT_DIR="gemini-cli-web"
GITHUB_REPO_NAME="Gemini-cli-ReactMUI"

# --- IMPORTANT: Your GitHub username (as requested) ---
GITHUB_USERNAME="smacksmack206"
# --- End of important configuration ---

# Ensure we are in the correct project directory
if [ "$(basename "$(pwd)")" != "$PROJECT_DIR" ]; then
  echo "Error: Please navigate into your '$PROJECT_DIR' directory before running this script."
  echo "Example: cd $PROJECT_DIR"
  exit 1
fi

echo "--- Starting Git Repository Setup for '$PROJECT_DIR' ---"

# 1. Initialize Git repository if not already initialized
if [ ! -d ".git" ]; then
  echo "Initializing new Git repository..."
  git init
else
  echo "Git repository already initialized."
fi

# 2. Add .env to .gitignore
echo "Configuring .gitignore to ignore .env..."
if grep -q ".env" .gitignore 2>/dev/null; then
  echo ".env is already in .gitignore."
else
  echo ".env" >> .gitignore
  echo "Added .env to .gitignore."
fi

# 3. Create an empty .env.example file
echo "Creating .env.example file..."
if [ ! -f ".env.example" ]; then
  touch .env.example
  echo "Created empty .env.example."
else
  echo ".env.example already exists. Skipping creation."
fi

# 4. Add all files to the staging area
echo "Adding all project files to Git staging area..."
git add .

# 5. Create the initial commit
echo "Creating initial commit..."
git commit -m "Initial commit: Set up project with .gitignore and .env.example"

# 6. Set the main branch name (common practice)
echo "Setting main branch name..."
git branch -M main

# 7. Set the remote origin using SSH
# SSH URL format: git@github.com:username/repository.git
REMOTE_URL="git@github.com:$GITHUB_USERNAME/$GITHUB_REPO_NAME.git"
echo "Setting remote origin to (SSH): $REMOTE_URL"

# Check if remote 'origin' already exists
if git remote get-url origin &>/dev/null; then
  echo "Remote 'origin' already exists. Updating its URL."
  git remote set-url origin "$REMOTE_URL"
else
  echo "Adding remote 'origin'."
  git remote add origin "$REMOTE_URL"
fi

# 8. Push to GitHub
echo "Pushing code to GitHub via SSH. Ensure your SSH key is added to your GitHub account."
git push -u origin main

echo "--- Git Repository Setup Complete! ---"
echo "Your project should now be pushed to https://github.com/$GITHUB_USERNAME/$GITHUB_REPO_NAME"
echo "Remember to visit GitHub to create the new repository '$GITHUB_REPO_NAME' if you haven't already, and ensure your SSH key is correctly set up."

