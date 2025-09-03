import os
import logging
from flask import Flask, render_template, jsonify
from notion_client import Client
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "fallback-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Initialize Notion client
notion = Client(auth=os.environ.get("NOTION_INTEGRATION_SECRET", ""))
database_id = os.environ.get("NOTION_DATABASE_ID", "")

@app.route('/')
def index():
    """Render the main gallery page."""
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    """Fetch data from Notion database."""
    try:
        if not database_id:
            app.logger.error("NOTION_DATABASE_ID not configured")
            return jsonify({"error": "Database ID not configured"}), 500
        
        response = notion.databases.query(database_id=database_id)
        app.logger.debug(f"Notion response: {len(response['results'])} items found")
        
        if response['results']:
            app.logger.debug(f"Sample data structure: {response['results'][0]}")
        
        return jsonify(response['results'])
    except Exception as e:
        app.logger.error(f"Error fetching data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/platforms')
def get_platforms():
    """Get available platform options from the database."""
    try:
        if not database_id:
            return jsonify({"error": "Database ID not configured"}), 500
        
        # Get database schema to extract platform options
        database = notion.databases.retrieve(database_id=database_id)
        
        platforms = set()
        
        # Look for platform field in database properties
        for prop_name, prop_data in database['properties'].items():
            if prop_name.lower() in ['platform', 'type', 'category']:
                if prop_data['type'] == 'multi_select':
                    for option in prop_data['multi_select']['options']:
                        platforms.add(option['name'])
                elif prop_data['type'] == 'select':
                    for option in prop_data['select']['options']:
                        platforms.add(option['name'])
        
        platform_list = sorted(list(platforms))
        app.logger.debug(f"Available platforms: {platform_list}")
        
        return jsonify(platform_list)
    except Exception as e:
        app.logger.error(f"Error fetching platforms: {str(e)}")
        return jsonify([]), 200  # Return empty array on error

@app.route('/api/statuses')
def get_statuses():
    """Get available status options from the database."""
    try:
        if not database_id:
            return jsonify({"error": "Database ID not configured"}), 500
        
        # Get database schema to extract status options
        database = notion.databases.retrieve(database_id=database_id)
        
        statuses = set()
        
        # Look for status field in database properties
        for prop_name, prop_data in database['properties'].items():
            if prop_name.lower() in ['status', 'state']:
                if prop_data['type'] == 'select':
                    for option in prop_data['select']['options']:
                        statuses.add(option['name'])
                elif prop_data['type'] == 'multi_select':
                    for option in prop_data['multi_select']['options']:
                        statuses.add(option['name'])
        
        status_list = sorted(list(statuses))
        app.logger.debug(f"Available statuses: {status_list}")
        
        return jsonify(status_list)
    except Exception as e:
        app.logger.error(f"Error fetching statuses: {str(e)}")
        return jsonify([]), 200  # Return empty array on error

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
