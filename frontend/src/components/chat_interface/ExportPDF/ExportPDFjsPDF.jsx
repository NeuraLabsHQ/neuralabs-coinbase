import { jsPDF } from 'jspdf';

const ExportPDFjsPDF = {
  exportChatToPDF: async (messages, options = {}) => {
    if (!messages || messages.length === 0) {
      return { success: false, error: 'No messages to export' };
    }

    try {
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set up constants
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margins = {
        top: 25,
        bottom: 25,
        left: 20,
        right: 20
      };
      const contentWidth = pageWidth - margins.left - margins.right;
      
      // Set up fonts and colors
      const colors = {
        header: [44, 62, 80],
        subheader: [52, 73, 94],
        user: [41, 128, 185],
        assistant: [39, 174, 96],
        text: [44, 62, 80],
        lightText: [127, 140, 141],
        timestamp: [149, 165, 166],
        userBg: [232, 248, 255],
        assistantBg: [248, 249, 250],
        border: [189, 195, 199]
      };

      let currentY = margins.top;

      // Add logo/branding area (optional gradient effect)
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 15, 'F');
      
      currentY = margins.top + 10;

      // Add header with better typography
      doc.setFontSize(24);
      doc.setTextColor(...colors.header);
      doc.setFont(undefined, 'bold');
      doc.text('NeuraLabs Chat Export', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 12;
      
      // Add export metadata
      doc.setFontSize(11);
      doc.setTextColor(...colors.lightText);
      doc.setFont(undefined, 'normal');
      const exportDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(exportDate, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 8;
      
      // Add message count
      const messageCount = messages.filter(msg => msg.role === 'user' || msg.role === 'assistant').length;
      doc.setFontSize(10);
      doc.text(`${messageCount} messages`, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 12;
      
      // Add a decorative line separator
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(margins.left + 30, currentY, pageWidth - margins.right - 30, currentY);
      
      currentY += 15;

      // Process messages
      const filteredMessages = messages.filter(msg => msg.role === 'user' || msg.role === 'assistant');
      
      for (let i = 0; i < filteredMessages.length; i++) {
        const message = filteredMessages[i];
        
        // Check if we need a new page
        if (currentY > pageHeight - margins.bottom - 40) {
          doc.addPage();
          currentY = margins.top;
          
          // Add subtle page header
          doc.setFontSize(9);
          doc.setTextColor(...colors.lightText);
          doc.setFont(undefined, 'italic');
          doc.text('NeuraLabs Chat Export', margins.left, margins.top - 10);
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margins.right, margins.top - 10, { align: 'right' });
        }

        const isUser = message.role === 'user';
        const roleText = isUser ? 'User' : 'AI Assistant';
        const roleColor = isUser ? colors.user : colors.assistant;
        const bgColor = isUser ? colors.userBg : colors.assistantBg;
        
        // Calculate message dimensions
        const messageWidth = isUser ? contentWidth - 20 : contentWidth - 10;
        const xOffset = isUser ? 20 : 10;
        const textWidth = messageWidth - 20;
        const lines = doc.splitTextToSize(message.content || '', textWidth);
        
        // Calculate how many lines fit on current page
        const availableSpace = pageHeight - margins.bottom - currentY - 10; // Leave some padding
        const linesThatFit = Math.floor(availableSpace / 5);
        const linesOnThisPage = Math.min(lines.length, linesThatFit);
        
        // Calculate height only for lines that will be on this page
        const messageHeight = (linesOnThisPage * 5) + 25;
        
        // Draw message card with shadow effect
        doc.setFillColor(220, 220, 220);
        doc.roundedRect(margins.left + xOffset + 1, currentY - 4, messageWidth, messageHeight, 4, 4, 'F');
        
        // Draw main message background
        doc.setFillColor(...bgColor);
        doc.roundedRect(margins.left + xOffset, currentY - 5, messageWidth, messageHeight, 4, 4, 'F');
        
        // Draw border
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(margins.left + xOffset, currentY - 5, messageWidth, messageHeight, 4, 4, 'S');
        
        // Message header section
        const headerY = currentY + 3;
        
        // Add role icon circle
        doc.setFillColor(...roleColor);
        doc.circle(margins.left + xOffset + 8, headerY, 3, 'F');
        
        // Add role label
        doc.setFontSize(11);
        doc.setTextColor(...roleColor);
        doc.setFont(undefined, 'bold');
        doc.text(roleText, margins.left + xOffset + 15, headerY + 1);
        
        // Add timestamp
        if (message.timestamp) {
          doc.setFontSize(9);
          doc.setTextColor(...colors.timestamp);
          doc.setFont(undefined, 'normal');
          const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });
          doc.text(timestamp, margins.left + xOffset + messageWidth - 10, headerY + 1, { align: 'right' });
        }
        
        currentY += 10;
        
        // Add separator line
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.2);
        doc.line(margins.left + xOffset + 10, currentY, margins.left + xOffset + messageWidth - 10, currentY);
        
        currentY += 5;
        
        // Add message content with better spacing
        doc.setFontSize(10.5);
        doc.setTextColor(...colors.text);
        doc.setFont(undefined, 'normal');
        
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          // Check if we need a new page
          if (currentY > pageHeight - margins.bottom) {
            doc.addPage();
            currentY = margins.top;
            
            // Add page header on new page
            doc.setFontSize(9);
            doc.setTextColor(...colors.lightText);
            doc.setFont(undefined, 'italic');
            doc.text('NeuraLabs Chat Export', margins.left, margins.top - 10);
            doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margins.right, margins.top - 10, { align: 'right' });
            
            currentY = margins.top + 5;
            
            // Draw continuation message background for remaining content
            const remainingLines = lines.length - lineIndex;
            const continuedHeight = Math.min((remainingLines * 5) + 20, pageHeight - margins.top - margins.bottom - 20);
            
            // Shadow
            doc.setFillColor(220, 220, 220);
            doc.roundedRect(margins.left + xOffset + 1, currentY - 4, messageWidth, continuedHeight, 4, 4, 'F');
            
            // Background
            doc.setFillColor(...bgColor);
            doc.roundedRect(margins.left + xOffset, currentY - 5, messageWidth, continuedHeight, 4, 4, 'F');
            
            // Border
            doc.setDrawColor(...colors.border);
            doc.setLineWidth(0.3);
            doc.roundedRect(margins.left + xOffset, currentY - 5, messageWidth, continuedHeight, 4, 4, 'S');
            
            // Add continuation header
            doc.setFontSize(9);
            doc.setTextColor(...colors.lightText);
            doc.setFont(undefined, 'italic');
            doc.text(`${roleText} (continued)`, margins.left + xOffset + 10, currentY + 3);
            currentY += 10;
            
            // Reset text settings for content
            doc.setFontSize(10.5);
            doc.setTextColor(...colors.text);
            doc.setFont(undefined, 'normal');
          }
          
          // Add the line
          doc.text(lines[lineIndex], margins.left + xOffset + 10, currentY);
          currentY += 5;
        }
        
        // Add spacing between messages
        currentY += 12;
        
        // Add conversation flow indicator between messages (except last)
        if (i < filteredMessages.length - 1) {
          doc.setDrawColor(...colors.border);
          doc.setLineWidth(0.5);
          const centerX = pageWidth / 2;
          doc.line(centerX - 2, currentY - 8, centerX - 2, currentY - 4);
          doc.line(centerX, currentY - 8, centerX, currentY - 4);
          doc.line(centerX + 2, currentY - 8, centerX + 2, currentY - 4);
          currentY += 4;
        }
      }
      
      // Add footer on last page
      currentY = pageHeight - margins.bottom + 10;
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.3);
      doc.line(margins.left, currentY, pageWidth - margins.right, currentY);
      
      currentY += 5;
      doc.setFontSize(9);
      doc.setTextColor(...colors.lightText);
      doc.setFont(undefined, 'italic');
      doc.text('Generated by NeuraLabs', pageWidth / 2, currentY, { align: 'center' });
      doc.text(`Total Pages: ${doc.internal.getNumberOfPages()}`, pageWidth / 2, currentY + 4, { align: 'center' });

      // Save the PDF
      const filename = `NeuraLabs_Chat_Export_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      return { success: true };
    } catch (error) {
      console.error('Error generating PDF with jsPDF:', error);
      return { success: false, error: error.message };
    }
  }
};

export default ExportPDFjsPDF;