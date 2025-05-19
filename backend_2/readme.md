1. In the config.yaml add the database configuration
2. install the dependencies
```bash
pip install -r requirements.txt
```
3. then run the run.py file
```bash
python run.py
```
These are some test curl commands to test the API
```bash
curl -X GET "http://localhost:8000/api/dashboard/all" -H "x-public-key: 0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46" -H "Content-Type: application/json"

curl -X GET "http://localhost:8000/api/dashboard/flows/recent" -H "x-public-key: 0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46" -H "Content-Type: application/json"

# Test API: Get flows under development
curl -X GET "http://localhost:8000/api/dashboard/flows/underdevelopment" -H "x-public-key: 0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46" -H "Content-Type: application/json"

curl -X GET "http://localhost:8000/api/dashboard/flows/published" -H "x-public-key: 0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46" -H "Content-Type: application/json"

# Test API: Get details for a specific flow (replace AGENT_ID with a real ID)
curl -X GET "http://localhost:8000/api/dashboard/flows/PM-3542974ceeaf69a01cd24288f66d52bb" -H "x-public-key: 0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46" -H "Content-Type: application/json"
```

