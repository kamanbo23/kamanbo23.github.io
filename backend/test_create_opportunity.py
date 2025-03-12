import requests
import json
from datetime import datetime, timedelta

# Admin login to get token
login_data = {
    'username': 'admin',
    'password': 'admin123'  # Change this to your admin password
}

login_url = 'http://localhost:8080/token'
try:
    login_resp = requests.post(login_url, data=login_data)
    token = login_resp.json().get('access_token')
    
    # If login successful, create opportunity
    if token:
        print(f'Login successful, got token: {token[:10]}...')
        
        # Test data with UPPERCASE type to see if our fix works
        opportunity_data = {
            'title': 'Test Opportunity',
            'organization': 'Test Org',
            'description': 'This is a test.',
            'type': 'RESEARCH',  # Purposely uppercase to test our fix
            'location': 'Test Location',
            'deadline': (datetime.now() + timedelta(days=30)).isoformat(),
            'contact_email': 'test@example.com',
            'requirements': ['Test', '', 'Req'],  # Include empty string to test cleaning
            'fields': ['AI'],
            'tags': ['Test']
        }
        
        # Create opportunity
        create_url = 'http://localhost:8080/opportunities/'
        headers = {'Authorization': f'Bearer {token}'}
        
        print(f'Sending opportunity data: {json.dumps(opportunity_data, indent=2)}')
        resp = requests.post(create_url, json=opportunity_data, headers=headers)
        
        # Print result
        print(f'Status code: {resp.status_code}')
        print(f'Response: {resp.text}')
    else:
        print('Login failed')
except Exception as e:
    print(f'Error during test: {str(e)}') 