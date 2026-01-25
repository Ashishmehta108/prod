---
description: How to set up and test the Label Printer (TSC TTP-244 Pro)
---

# Printer Setup and Testing Workflow

To print labels from the application, your printer must be shared on Windows so the server can send raw TSPL commands to it.

## 1. Share the Printer on Windows
1.  Open **Control Panel** > **Devices and Printers**.
2.  Locate your **TSC TTP-244 Pro** printer.
3.  Right-click it and select **Printer properties**.
4.  Go to the **Sharing** tab.
5.  Click **Change Sharing Options** (if prompted).
6.  Check **Share this printer**.
7.  Set the Share name to: `TSC_TTP_244_Pro` (This is the default name used in the script).
8.  Click **OK**.

## 2. Verify Connection
Open Windows Explorer and type `\\localhost` in the address bar. You should see `TSC_TTP_244_Pro` listed as a shared device.

## 3. Run the Test Script
You can now run the test script to verify that the application can send data to the printer.

// turbo
```powershell
npm run test-print
```

## 4. Troubleshooting
- **Error: "The network path was not found"**: Ensure the printer is shared and the name matches exactly.
- **Job sent but nothing prints**: 
    - Ensure the printer is ON and has labels/ribbon.
    - Check if the printer is in "Error" state in Windows.
    - Ensure the printer supports TSPL (TSC printers usually do).
