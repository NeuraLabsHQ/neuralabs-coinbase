# elements/inputs/rest_api.py
from typing import Dict, Any, Optional
import json
import httpx
import asyncio
import base64
import time
from urllib.parse import urlencode

from core.element_base import ElementBase
from utils.logger import logger
from utils.validators import validate_inputs

class RestAPI(ElementBase):
    """REST API element for making HTTP requests to external APIs."""
    
    def __init__(self, element_id: str, name: str, description: str,
                 input_schema: Dict[str, Any], output_schema: Dict[str, Any],
                 parameters: Dict[str, Any] = None, **kwargs):
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="rest_api",
            description=description,
            input_schema=input_schema,
            output_schema=output_schema
        )
        
        # Extract parameters
        params = parameters or {}
        self.url = params.get("url", "")
        self.method = params.get("method", "GET").upper()
        self.default_headers = params.get("headers", {"Content-Type": "application/json", "Accept": "application/json"})
        self.auth_type = params.get("auth_type", "none")
        self.auth_config = params.get("auth_config", {})
        self.timeout = params.get("timeout", 30)
        self.retry_count = params.get("retry_count", 3)
        self.retry_delay = params.get("retry_delay", 1)
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the REST API element."""
        # Log execution
        logger.info(f"Executing REST API element: {self.name} ({self.element_id})")
        
        # Validate inputs
        validation_result = validate_inputs(self.inputs, self.input_schema)
        if not validation_result["valid"]:
            error_msg = f"Invalid inputs for REST API element: {validation_result['error']}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Get inputs
        url_params = self.inputs.get("url_params", {})
        query_params = self.inputs.get("query_params", {})
        body = self.inputs.get("body", {})
        headers_override = self.inputs.get("headers", {})
        
        # Build final URL with templating
        final_url = self._build_url(self.url, url_params)
        
        # Merge headers
        headers = {**self.default_headers, **headers_override}
        
        # Apply authentication
        headers = self._apply_auth(headers, query_params)
        
        # Stream API request info
        safe_headers = self._redact_sensitive_data(headers)
        safe_query = self._redact_sensitive_data(query_params)
        safe_body = self._redact_sensitive_data(body) if body else None
        
        await executor._stream_event("api_request", {
            "element_id": self.element_id,
            "url": final_url,
            "method": self.method,
            "headers": safe_headers,
            "query_params": safe_query,
            "body_preview": str(safe_body)[:500] if safe_body else None
        })
        
        # Retry logic
        last_error = None
        for attempt in range(self.retry_count):
            try:
                response = await self._make_request(final_url, headers, query_params, body)
                
                # Parse response
                response_data = await self._parse_response(response)
                
                # Set outputs
                self.outputs = {
                    "response": response_data,
                    "status_code": response.status_code,
                    "headers": dict(response.headers)
                }
                
                # Stream response info
                await executor._stream_event("api_response", {
                    "element_id": self.element_id,
                    "status_code": response.status_code,
                    "response_preview": str(response_data)[:1000] + ("..." if len(str(response_data)) > 1000 else "")
                })
                
                return self.outputs
                
            except httpx.HTTPStatusError as e:
                last_error = f"HTTP error {e.response.status_code}: {e.response.text}"
                logger.warning(f"API request attempt {attempt + 1} failed: {last_error}")
                
                # Don't retry on 4xx errors (client errors)
                if 400 <= e.response.status_code < 500:
                    break
                    
            except Exception as e:
                last_error = str(e)
                logger.warning(f"API request attempt {attempt + 1} failed: {last_error}")
            
            # Wait before retry (except on last attempt)
            if attempt < self.retry_count - 1:
                await asyncio.sleep(self.retry_delay * (attempt + 1))
        
        # All attempts failed
        error_msg = f"API request failed after {self.retry_count} attempts: {last_error}"
        logger.error(error_msg)
        
        # Stream error info
        await executor._stream_event("api_error", {
            "element_id": self.element_id,
            "error": error_msg
        })
        
        # Return error in outputs
        self.outputs = {
            "response": None,
            "status_code": 0,
            "error": error_msg
        }
        return self.outputs
    
    async def _make_request(self, url: str, headers: Dict[str, str], 
                          query_params: Dict[str, Any], body: Any) -> httpx.Response:
        """Make the actual HTTP request."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            if self.method == "GET":
                return await client.get(url, headers=headers, params=query_params)
            elif self.method == "POST":
                return await client.post(url, headers=headers, params=query_params, json=body if body else None)
            elif self.method == "PUT":
                return await client.put(url, headers=headers, params=query_params, json=body if body else None)
            elif self.method == "PATCH":
                return await client.patch(url, headers=headers, params=query_params, json=body if body else None)
            elif self.method == "DELETE":
                return await client.delete(url, headers=headers, params=query_params)
            elif self.method == "HEAD":
                return await client.head(url, headers=headers, params=query_params)
            elif self.method == "OPTIONS":
                return await client.options(url, headers=headers, params=query_params)
            else:
                raise ValueError(f"Unsupported HTTP method: {self.method}")
    
    async def _parse_response(self, response: httpx.Response) -> Any:
        """Parse response based on content type."""
        content_type = response.headers.get("content-type", "").lower()
        
        if "application/json" in content_type:
            try:
                return response.json()
            except json.JSONDecodeError:
                return {"text": response.text}
        elif "text/" in content_type:
            return {"text": response.text}
        else:
            # For binary content, return base64 encoded
            return {"binary": base64.b64encode(response.content).decode()}
    
    def _build_url(self, base_url: str, url_params: Dict[str, Any]) -> str:
        """Build URL with parameter substitution."""
        url = base_url
        
        # Replace {param} style placeholders
        for key, value in url_params.items():
            placeholder = f"{{{key}}}"
            if placeholder in url:
                url = url.replace(placeholder, str(value))
        
        return url
    
    def _apply_auth(self, headers: Dict[str, str], query_params: Dict[str, Any]) -> Dict[str, str]:
        """Apply authentication based on auth_type."""
        if self.auth_type == "none":
            return headers
            
        elif self.auth_type == "bearer":
            token = self.auth_config.get("token", "")
            if token:
                headers["Authorization"] = f"Bearer {token}"
                
        elif self.auth_type == "basic":
            username = self.auth_config.get("username", "")
            password = self.auth_config.get("password", "")
            if username and password:
                credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
                headers["Authorization"] = f"Basic {credentials}"
                
        elif self.auth_type == "api_key":
            location = self.auth_config.get("location", "header")
            key_name = self.auth_config.get("key_name", "X-API-Key")
            key_value = self.auth_config.get("key_value", "")
            
            if key_value:
                if location == "header":
                    headers[key_name] = key_value
                elif location == "query":
                    query_params[key_name] = key_value
        
        return headers
    
    def _redact_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Redact sensitive data like API keys and tokens."""
        if not isinstance(data, dict):
            return data
            
        sensitive_keys = ["api_key", "apikey", "key", "token", "secret", "password", "auth", "authorization"]
        redacted = {}
        
        for k, v in data.items():
            if any(sensitive in k.lower() for sensitive in sensitive_keys):
                redacted[k] = "********"
            else:
                redacted[k] = v
                
        return redacted
