Grok AI MCP Server
Welcome to the Grok AI MCP Server, a Node.js-based server that integrates with the xAI Grok API to provide powerful AI-driven analysis tools for the Solana blockchain and beyond. This server leverages the Model Context Protocol (MCP) to expose a set of tools for analyzing transactions, addresses, images, and general queries using Grok's advanced capabilities, including vision.

Overview
The Grok AI MCP Server is designed to:

Analyze Solana blockchain transactions and addresses with detailed insights.
Process images (via base64 or URL) using Grok's vision capabilities.
Answer general questions with optional context and image support.
Operate over a standard I/O transport using the MCP SDK.
Built with scalability and ease of use in mind, this server can be extended with additional tools and capabilities as needed.

Features
Transaction Analysis: Analyze Solana transaction signatures with optional screenshots and details.
Address Analysis: Investigate Solana addresses with optional visual data.
Image Analysis: Use Grok's vision to interpret images based on user prompts.
General Queries: Ask Grok anything, with support for context and images.
Error Handling: Robust error management with MCP-specific error codes.
Stdio Transport: Runs over standard input/output for flexible integration.
Getting Started
Prerequisites
Node.js: Version 16 or higher.
npm: Node package manager.
xAI API Key: Obtain an API key from xAI to interact with the Grok API.
Solana Knowledge: Basic understanding of Solana blockchain concepts is helpful but not required.
Installation
Clone the Repository
bash

Collapse

Wrap

Copy
git clone https://github.com/yourusername/grok-ai-mcp-server.git
cd grok-ai-mcp-server
Install Dependencies
bash

Collapse

Wrap

Copy
npm install
Set Up Environment Variables Create a .env file in the root directory and add your xAI API key:
text

Collapse

Wrap

Copy
XAI_API_KEY=your-xai-api-key-here
Run the Server
bash

Collapse

Wrap

Copy
npm start
The server will start and listen on standard I/O. You should see:
text

Collapse

Wrap

Copy
Grok AI MCP server running on stdio
Usage
The server exposes four main tools via the MCP interface:

1. Analyze Transaction
Tool Name: analyze_transaction
Description: Analyzes a Solana transaction signature.
Input:
signature (required): Transaction signature (string).
screenshot (optional): Base64-encoded image (string).
details (optional): JSON string with additional transaction data.
Example:
json

Collapse

Wrap

Copy
{
  "name": "analyze_transaction",
  "arguments": {
    "signature": "5y2...abc",
    "screenshot": "data:image/jpeg;base64,...",
    "details": "{\"amount\": \"1.5 SOL\", \"program\": \"Tokenkeg...\"}"
  }
}
2. Analyze Address
Tool Name: analyze_address
Description: Analyzes a Solana address.
Input:
address (required): Solana address (string).
screenshot (optional): Base64-encoded image (string).
Example:
json

Collapse

Wrap

Copy
{
  "name": "analyze_address",
  "arguments": {
    "address": "7xK...xyz",
    "screenshot": "data:image/jpeg;base64,..."
  }
}
3. Analyze Image
Tool Name: analyze_image
Description: Analyzes an image with a user-provided prompt.
Input:
prompt (required): Question or instruction (string).
image (optional): Base64-encoded image (string).
image_url (optional): URL to an image (string).
Example:
json

Collapse

Wrap

Copy
{
  "name": "analyze_image",
  "arguments": {
    "prompt": "What does this chart show?",
    "image": "data:image/jpeg;base64,..."
  }
}
4. Ask Grok
Tool Name: ask_grok
Description: Ask Grok a general question.
Input:
question (required): The question to ask (string).
context (optional): Additional context (string).
image (optional): Base64-encoded image (string).
image_url (optional): URL to an image (string).
Example:
json

Collapse

Wrap

Copy
{
  "name": "ask_grok",
  "arguments": {
    "question": "What is Solana's consensus mechanism?",
    "context": "I'm new to blockchain technology."
  }
}
Interacting with the Server
The server uses MCP over stdio. You can interact with it programmatically using an MCP client or by sending JSON requests via a compatible interface. Refer to the MCP SDK Documentation for details on client implementation.

Configuration
API Key: Set via the XAI_API_KEY environment variable.
Model Selection: The server uses grok-2-vision-latest for vision tasks and grok-2-latest for text-only queries.
Temperature: Set to 0.7 for balanced creativity and accuracy (adjustable in code).
Development
Project Structure
text

Collapse

Wrap

Copy
├── index.js        # Main server code
├── package.json    # Dependencies and scripts
├── .env            # Environment variables (not tracked)
└── README.md       # This file
Extending the Server
To add new tools:

Update the setRequestHandler for ListToolsRequestSchema with the new tool definition.
Add a corresponding handler in the CallToolRequestSchema switch statement.
Implement the handler logic in a new method (e.g., handleNewTool).
Error Handling
The server uses MCP error codes:

InvalidParams: Missing or invalid input.
MethodNotFound: Unknown tool requested.
Custom error messages are returned in the response content.
Contributing
Contributions are welcome! Please:

Fork the repository.
Create a feature branch (git checkout -b feature/new-tool).
Commit your changes (git commit -m "Add new tool").
Push to the branch (git push origin feature/new-tool).
Open a pull request.
License
This project is licensed under the MIT License. See the LICENSE file for details.

Acknowledgments
Built with the Model Context Protocol SDK.
Powered by xAI's Grok API.
Inspired by the Solana developer community.
Feel free to adjust the repository URL, license, or any other details to match your specific project setup! Let me know if you'd like to refine any section further.
