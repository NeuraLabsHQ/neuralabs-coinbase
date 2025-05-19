"""
Dashboard module initialization
This module handles all dashboard-related functionality
"""

# Import necessary modules and functions as needed
# This allows other modules to import from dashboard module
from ...modules.get_data.dashboard import (
    get_user_created_flows,
    get_user_accessed_flows,
    get_recently_opened_flows,
    get_under_development_flows,
    get_published_flows,
    get_shared_flows,
    get_flow_details
)