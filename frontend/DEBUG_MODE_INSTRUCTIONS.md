# Debug Mode Instructions for Interactive Publish

## Overview
The Interactive Publish journey now includes a debug mode that allows developers to reset from any specific step without losing form data or session storage.

## How to Enable Debug Mode

1. **Set the environment variable** in your `.env` file:
   ```
   VITE_DEBUG=true
   ```

2. **Restart your development server** to pick up the environment variable change:
   ```bash
   npm start
   ```

## Using Debug Mode

When debug mode is enabled:

1. **Refresh buttons appear** on completed steps when you hover over them
2. **Click the refresh icon** on any completed step to reset from that point
3. **All subsequent steps** will be marked as incomplete
4. **Your form data remains intact** - you can re-execute steps with the same data

## What Gets Reset

When you reset from a specific step, the following data is cleared for that step and all subsequent steps:

- **Step 1 (Wallet)**: Wallet connection status
- **Step 2 (Flow)**: Flow ID
- **Step 3 (Compile)**: Compiled flow data
- **Step 4 (Metadata)**: Metadata information
- **Step 5 (Mint NFT)**: NFT ID and object information
- **Step 6 (SUI Balance)**: Balance check status
- **Step 7 (Exchange)**: WAL token balance
- **Step 8 (Seal Prep)**: Encryption preparation
- **Step 9 (Seal Sign)**: Session key
- **Step 10 (Seal Encrypt)**: Encrypted blob data
- **Step 11 (Storage)**: Walrus blob ID

## Important Notes

- Form data (version number, description) is **NOT** cleared
- Session storage data is **NOT** cleared
- Only the completion status of steps is reset
- You can re-execute steps with the same or modified data

## Visual Indicators

- **Refresh icon**: Small circular arrow icon in the top-right of completed steps
- **Hover effect**: Icon appears on hover with a warning color
- **Tooltip**: Shows "Reset from step X: [Step Name]"

## Troubleshooting

If refresh buttons don't appear:
1. Verify `VITE_DEBUG=true` is set in `.env`
2. Restart the development server
3. Clear browser cache if needed
4. Check browser console for any errors

## Security Note

Debug mode should **NEVER** be enabled in production. Always ensure `VITE_DEBUG=false` or remove the variable entirely before deploying.