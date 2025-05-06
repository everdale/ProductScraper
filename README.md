# Svea AI Application

## Overview

The Svea AI Application is designed to scrape product data from web-shops like Webhallen and Kjell, providing a unified frontend for users to view and order products. The application aims to streamline the shopping experience by offering features such as product comparison and news updates.

# Project Setup Instructions

## Setting Up the Virtual Environment

1. **Create a Virtual Environment**:
   - Run the following command to create a virtual environment:
     ```bash
     python -m venv .venv
     ```

2. **Activate the Virtual Environment**:
   - On Windows, use:
     ```bash
     .venv\Scripts\activate
     ```
   - On macOS and Linux, use:
     ```bash
     source .venv/bin/activate
     ```

3. **Install Dependencies**:
   - With the virtual environment activated, install the required packages:
     ```bash
     pip install -r requirements.txt
     ```

## Additional Notes

- Ensure that the `.venv` directory is included in your `.gitignore` file to prevent it from being added to version control.
- Use the `requirements.txt` file to manage dependencies and ensure consistency across different environments.
