# elements/search/duckduckgo_search.py
from typing import Dict, Any, List, Optional
import httpx
from bs4 import BeautifulSoup
import urllib.parse
import asyncio
from dataclasses import dataclass
import json
import re
from urllib.parse import urlparse

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from utils.logger import logger


@dataclass
class SearchResult:
    title: str
    link: str
    full_content: str
    position: int


class DuckDuckGoSearch(ElementBase):
    """DuckDuckGo Web Search Element."""
    
    BASE_URL = "https://html.duckduckgo.com/html"
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    def __init__(self, 
                 element_id: str, 
                 name: str, 
                 description: str,
                 input_schema: Dict[str, Any], 
                 output_schema: Dict[str, Any],
                 node_description: Optional[str] = None,
                 processing_message: Optional[str] = None,
                 tags: Optional[List[str]] = None,
                 layer: int = 1,
                 parameters: Optional[Dict[str, Any]] = None,
                 hyperparameters: Optional[Dict[str, HyperparameterSchema]] = None,
                 parameter_schema_structure: Optional[Dict[str, Any]] = None,
                 # Search specific parameters
                 max_results: int = 10,
                 include_snippets: bool = True):
        
        # Set default parameters if not provided
        if parameters is None:
            parameters = {
                "max_results": max_results,
                "include_snippets": include_snippets
            }
        
        # Default hyperparameters for search element
        if hyperparameters is None:
            hyperparameters = {
                "name": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Element Name",
                    description="Display name for this element"
                ),
                "description": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Description",
                    description="User-provided description"
                ),
                "processing_message": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Processing Message",
                    description="Message shown during execution"
                ),
                "parameters.max_results": HyperparameterSchema(
                    access_level=AccessLevel.L3,
                    display_name="Max Results",
                    description="Maximum number of search results to return"
                ),
                "parameters.include_snippets": HyperparameterSchema(
                    access_level=AccessLevel.L3,
                    display_name="Include Snippets",
                    description="Whether to include result snippets"
                )
            }
        
        # Default parameter schema structure if not provided
        if parameter_schema_structure is None:
            parameter_schema_structure = {
                "max_results": {
                    "type": "int",
                    "description": "Maximum number of search results to return",
                    "default": 10,
                    "required": False,
                    "min": 1,
                    "max": 50
                },
                "include_snippets": {
                    "type": "bool",
                    "description": "Whether to include result snippets in the output",
                    "default": True,
                    "required": False
                }
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="duckduckgo_search",
            description=description,
            node_description=node_description or "Searches the web using DuckDuckGo",
            processing_message=processing_message or "Searching the web...",
            tags=tags or ["search", "web", "duckduckgo"],
            layer=layer,
            input_schema=input_schema,
            output_schema=output_schema,
            parameters=parameters,
            hyperparameters=hyperparameters,
            parameter_schema_structure=parameter_schema_structure
        )
    
    async def execute(self, 
                      executor, 
                      backtracking=False) -> Dict[str, Any]:
        
        """Execute DuckDuckGo web search."""
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        if not self.validate_inputs():
            missing_inputs = [name for name, schema in self.input_schema.items() 
                             if schema.get('required', False) and name not in self.inputs]
            raise ValueError(f"Missing required inputs for DuckDuckGo Search element: {missing_inputs}")
        
        # Get inputs
        query = self.inputs.get("query", "")
        if not query:
            raise ValueError("Search query cannot be empty")
        
        # Get parameters
        max_results = self.parameters.get("max_results", 10)
        include_snippets = self.parameters.get("include_snippets", True)
        
        # Stream search initiation
        if executor.stream_manager:
            await executor._stream_event("search_start", {
                "element_id": self.element_id,
                "query": query,
                "max_results": max_results
            })
        
        try:
            # Perform the search
            search_results = await self._perform_search(query, max_results)
            
            # Format results
            # First output: just the URLs
            urls_only = [result.link for result in search_results]
            
            # Second output: comprehensive summary of all results
            comprehensive_summary = self._create_comprehensive_summary(search_results, query)
            
            # Set outputs
            self.outputs = {
                "search_results": urls_only,
                "formatted_results": comprehensive_summary,
                "result_count": len(search_results)
            }
            
            # Stream completion
            if executor.stream_manager:
                await executor._stream_event("search_complete", {
                    "element_id": self.element_id,
                    "result_count": len(search_results)
                })
            
            # Validate output
            if not self.validate_outputs():
                missing_outputs = [name for name, schema in self.output_schema.items() 
                                  if schema.get('required', False) and name not in self.outputs]
                raise ValueError(f"Search output does not match required schema. Missing: {missing_outputs}")
            
            return self.outputs
            
        except Exception as e:
            logger.error(f"Error performing DuckDuckGo search: {str(e)}")
            # Return empty results on error
            self.outputs = {
                "search_results": [],
                "formatted_results": f"Error performing search: {str(e)}",
                "result_count": 0
            }
            return self.outputs
    
    async def _perform_search(self, query: str, max_results: int) -> List[SearchResult]:
        """Perform the actual DuckDuckGo search."""
        try:
            # Create form data for POST request
            data = {
                "q": query,
                "b": "",
                "kl": "",
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.BASE_URL, 
                    data=data, 
                    headers=self.HEADERS, 
                    timeout=30.0
                )
                response.raise_for_status()
            
            # Parse HTML response
            soup = BeautifulSoup(response.text, "html.parser")
            if not soup:
                logger.error("Failed to parse HTML response")
                return []
            
            results = []
            for result in soup.select(".result"):
                title_elem = result.select_one(".result__title")
                if not title_elem:
                    continue
                
                link_elem = title_elem.find("a")
                if not link_elem:
                    continue
                
                title = link_elem.get_text(strip=True)
                link = link_elem.get("href", "")
                
                # Skip ad results
                if "y.js" in link:
                    continue
                
                # Clean up DuckDuckGo redirect URLs
                if link.startswith("//duckduckgo.com/l/?uddg="):
                    link = urllib.parse.unquote(link.split("uddg=")[1].split("&")[0])
                
                # Get initial snippet
                snippet_elem = result.select_one(".result__snippet")
                snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
                
                results.append(
                    SearchResult(
                        title=title,
                        link=link,
                        full_content=snippet,  # Temporarily store snippet, will be replaced with full content
                        position=len(results) + 1,
                    )
                )
                
                if len(results) >= max_results:
                    break
            
            logger.info(f"Successfully found {len(results)} search results for query: {query}")
            
            # Fetch full content for each result
            logger.info("Fetching full content from URLs...")
            results_with_content = await self._fetch_full_content_for_results(results)
            
            return results_with_content
            
        except httpx.TimeoutException:
            logger.error("Search request timed out")
            raise Exception("Search request timed out")
        except httpx.HTTPError as e:
            logger.error(f"HTTP error occurred: {str(e)}")
            raise Exception(f"HTTP error occurred: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during search: {str(e)}")
            raise
    
    async def _fetch_full_content_for_results(self, results: List[SearchResult]) -> List[SearchResult]:
        """Fetch full content for each search result."""
        async def fetch_content(result: SearchResult) -> SearchResult:
            try:
                content = await self._fetch_page_content(result.link)
                result.full_content = content if content else result.full_content
            except Exception as e:
                logger.warning(f"Failed to fetch content from {result.link}: {str(e)}")
            return result
        
        # Fetch content for all results concurrently
        tasks = [fetch_content(result) for result in results]
        results_with_content = await asyncio.gather(*tasks)
        
        return results_with_content
    
    async def _fetch_page_content(self, url: str) -> str:
        """Fetch and extract main content from a webpage."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self.HEADERS,
                    timeout=10.0,
                    follow_redirects=True
                )
                response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Remove script and style elements
            for script in soup(["script", "style", "noscript"]):
                script.decompose()
            
            # Try to find main content areas
            content_areas = []
            
            # Look for article tags
            articles = soup.find_all("article")
            for article in articles:
                content_areas.append(article.get_text(separator=" ", strip=True))
            
            # Look for main tags
            mains = soup.find_all("main")
            for main in mains:
                content_areas.append(main.get_text(separator=" ", strip=True))
            
            # Look for content divs (common patterns)
            content_divs = soup.find_all("div", class_=re.compile(r"content|article|post|entry|text"))
            for div in content_divs:
                content_areas.append(div.get_text(separator=" ", strip=True))
            
            # If no specific content areas found, get body text
            if not content_areas:
                body = soup.find("body")
                if body:
                    content_areas.append(body.get_text(separator=" ", strip=True))
            
            # Combine and clean content
            full_content = " ".join(content_areas)
            
            # Clean up the text
            full_content = re.sub(r'\s+', ' ', full_content)  # Replace multiple spaces with single space
            full_content = re.sub(r'\n+', ' ', full_content)  # Replace multiple newlines with space
            full_content = full_content.strip()
            
            # Limit content length to prevent overwhelming responses
            max_content_length = 5000
            if len(full_content) > max_content_length:
                full_content = full_content[:max_content_length] + "..."
            
            return full_content if full_content else "Unable to extract content from this page."
            
        except Exception as e:
            logger.error(f"Error fetching content from {url}: {str(e)}")
            return f"Error fetching content: {str(e)}"
    
    def _create_comprehensive_summary(self, results: List[SearchResult], query: str) -> str:
        """Create a comprehensive content dump from all search results."""
        if not results:
            return ""
        
        # Just combine all full content without titles
        all_content = []
        
        for result in results:
            # Add only the full content
            all_content.append(result.full_content)
        
        # Join with space
        full_text = " ".join(all_content)
        
        # Basic cleanup
        full_text = full_text.replace("...", ". ")
        full_text = full_text.replace("  ", " ")
        
        return full_text