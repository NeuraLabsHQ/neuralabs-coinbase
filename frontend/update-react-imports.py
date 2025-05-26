#!/usr/bin/env python3
import re
import os

# List of files to update
files = [
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/AccessHomePage.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/AccessMainContent.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/AccessPage.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/AccessSidebar.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/AgentDetailPage.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/FlowActionPanel.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/FlowCard.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/pages/AccessControlPage.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/pages/ChatPage.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/pages/DownloadPage.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/pages/EditFlowPage.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/pages/FlowViewPage.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/pages/MetadataPage.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/pages/PublishPage.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/pages/SettingsPage.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/Popup/PublishModal.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/auth/ZkLoginCallback.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/chat_interface/ChatInterface.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/chat_interface/ThinkingUI/ThinkingUI.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/common_components/NavPanel/NavelPanel.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/flow_builder/BlocksPanel/BlocksPanel.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/flow_builder/ConnectionPopup/ConnectionPopup.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/flow_builder/DetailsPanel/DescriptionPopup.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/flow_builder/DetailsPanel/SchemaPopup.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/flow_builder/flow_builder.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/flow_builder/FlowCanvas/FlowCanvas.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/flow_builder/VisualizePanel/VisualizePanel.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/marketplace/MarketplaceContent/MarketplaceContent.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/pages/flow_builder_page.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/access_management/Popup/CreateAgentModal.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/common_components/CustomConnectButton/CustomConnectButton.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/common_components/WalletMethodSelector/WalletMethodSelector.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/common_components/WalletModal/WalletModal.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/contexts/WalletContext.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/chat_interface/ChatPage/ChatPage.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/flow_builder/CodePanel/CodePanel.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/flow_builder/TemplatePanel/TemplatePanel.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/marketplace/marketplace.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/marketplace/MarketplaceContent/MarketplaceDetailPanel.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/components/marketplace/MarketplacePanel/MarketplaceSidebar.jsx",
    "/home/sid/projects/06_02 NeuraLabs/neuralabs-sui/frontend/src/contexts/ThemeContext.jsx"
]

# Pattern to match React default import with named imports
pattern = re.compile(r'^import\s+React\s*,\s*\{([^}]+)\}\s*from\s*[\'"]react[\'"];?\s*$', re.MULTILINE)

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Replace the pattern
        new_content = pattern.sub(r'import {\1} from 'react';', content)
        
        if new_content != content:
            with open(file_path, 'w') as f:
                f.write(new_content)
            print(f"Updated: {file_path}")
        else:
            print(f"No changes needed: {file_path}")
    else:
        print(f"File not found: {file_path}")

print("\nImport updates completed!")