// src/components/access_management/pages/EditFlowPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EditFlowPage = ({ agentData }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to flow builder with view-only mode
    navigate(`/flow-builder/${agentData.agent_id}?mode=edit`, { 
      state: { 
        flowData: agentData,
        viewOnly: false // Allow editing
      } 
    });
  }, [agentData, navigate]);
  
  return null;
};

export default EditFlowPage;