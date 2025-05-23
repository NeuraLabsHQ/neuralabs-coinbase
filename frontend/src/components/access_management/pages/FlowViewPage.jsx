// src/components/access_management/pages/FlowViewPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FlowViewPage = ({ agentData }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to flow builder with view-only mode
    navigate(`/flow-builder/${agentData.agent_id}?mode=view`, { 
      state: { 
        flowData: agentData,
        viewOnly: true // View only mode
      } 
    });
  }, [agentData, navigate]);
  
  return null;
};

export default FlowViewPage;