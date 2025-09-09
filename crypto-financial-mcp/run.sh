#!/bin/bash

echo "Starting Crypto Financial MCP Server..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo
    echo "WARNING: .env file not found!"
    echo "Please copy .env.example to .env and add your API key"
    echo
    cp .env.example .env
    echo "Created .env file. Please edit it with your API key."
    read -p "Press Enter to continue..."
fi

# Start the MCP server
echo
echo "Starting MCP Server..."
echo "Press Ctrl+C to stop"
echo
python main.py
