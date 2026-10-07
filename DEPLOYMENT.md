# 🚀 Open-Source Deployment Guide

This project can be deployed **completely free** without any paid services using standard open-source tools. Choose the method that best fits your needs:

---

## ⚡ Option 1: Instant Public Link (Fastest — 10 Seconds, No Signup)

If you need an immediate live public link to demonstrate to teachers, recruiters, or friends without setting up cloud accounts:

1. **Start the local server** (Terminal 1):
   ```bash
   cd d:\ECS_60_SWAPNIL_TALLOO\inventory-management-system
   venv\Scripts\activate
   python app.py
   ```

2. **Expose it publicly using open-source SSH tunnel** (Terminal 2):
   ```bash
   ssh -R 80:localhost:5000 localhost.run
   ```
   *(Windows comes with built-in OpenSSH; no downloads needed).*

3. The terminal will output an instant public HTTPS link like:
   ```
   https://your-session.lhr.life
   ```
   Anyone in the world can now open that URL and use your application in real time!

---

## 🌐 Option 2: Deploy to Render.com (Free 24/7 Cloud Hosting)

Render offers a generous free tier for Python web services and requires **no credit card**.

### Step 1: Push Project to GitHub
In your project directory:
```bash
git init
git add .
git commit -m "Initial commit for inventory management system"
git branch -M main
git remote add origin https://github.com/<your-username>/inventory-management-system.git
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to [https://render.com](https://render.com) and sign in with GitHub (Free).
2. Click **New +** → **Web Service**.
3. Select your `inventory-management-system` repository.
4. Fill in these settings:
   - **Name**: `inventory-management` (or any name you like)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn wsgi:app`
   - **Instance Type**: `Free`
5. Click **Create Web Service**.

Within 2 minutes, Render will build and deploy your app at:
`https://inventory-management-<random-id>.onrender.com`

---

## 🐍 Option 3: Deploy to PythonAnywhere (100% Free Python Host)

PythonAnywhere is specifically built for Python and SQLite, making it ideal for academic projects:

1. Create a free account at [https://www.pythonanywhere.com](https://www.pythonanywhere.com).
2. Open a **Bash Console** in your dashboard.
3. Clone your GitHub repository or upload the files:
   ```bash
   git clone https://github.com/<your-username>/inventory-management-system.git
   cd inventory-management-system
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
4. Go to the **Web** tab in PythonAnywhere and click **Add a new web app**:
   - Choose **Manual Configuration** → **Python 3.10+**.
   - Under **Virtualenv**, set path to: `/home/<username>/inventory-management-system/venv`
   - Edit the **WSGI configuration file** and set:
     ```python
     import sys
     path = '/home/<username>/inventory-management-system'
     if path not in sys.path:
         sys.path.append(path)

     from wsgi import app as application
     ```
5. Click **Reload <username>.pythonanywhere.com** and your app is live!

---

## 🐳 Option 4: Open Source Docker Container

To run this app in an isolated open-source container anywhere (local machine, Raspberry Pi, VPS, Coolify, or CapRover):

1. **Build the container image**:
   ```bash
   docker build -t inventory-app .
   ```

2. **Run the container**:
   ```bash
   docker run -d -p 5000:5000 --name inventory-system inventory-app
   ```

3. **Access the application**:
   Open your browser at `http://localhost:5000`.

---

## 📁 Pre-configured Deployment Files Included in the Project

The project is already pre-configured with all necessary files:
- **`wsgi.py`** — Universal WSGI entry point for Gunicorn / PythonAnywhere / uWSGI
- **`Procfile`** — For PaaS hosting (Render, Railway, Heroku)
- **`requirements.txt`** — With dependencies and Gunicorn included
- **`Dockerfile`** — Ready-to-build lightweight Docker container
- **`.dockerignore`** — Keeps container builds clean and fast
- **`.gitignore`** — Prevents committing virtual environments and caches
