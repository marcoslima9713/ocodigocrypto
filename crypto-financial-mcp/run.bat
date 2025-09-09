@echo off
echo Starting Crypto Financial MCP Server...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check if .env file exists
if not exist ".env" (
    echo.
    echo WARNING: .env file not found!
    echo Please copy .env.example to .env and add your API key
    echo.
    copy .env.example .env
    echo Created .env file. Please edit it with your API key.
    pause
)

REM Start the MCP server
echo.
echo Starting MCP Server...
echo Press Ctrl+C to stop
echo.
python main.py

pause
