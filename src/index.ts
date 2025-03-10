#!/usr/bin/env node
import axios from 'axios';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  StdioServerTransport,
} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequest,
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

class GrokAIServer {
  private server: Server;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.XAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('XAI_API_KEY environment variable is required');
    }

    this.server = new Server(
      {
        name: 'grok-ai-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error: any) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_transaction',
          description: 'Analyze a Solana transaction using Grok AI',
          inputSchema: {
            type: 'object',
            properties: {
              signature: {
                type: 'string',
                description: 'Transaction signature to analyze',
              },
              screenshot: {
                type: 'string',
                description: 'Optional base64 encoded screenshot of transaction data',
              },
              details: {
                type: 'string',
                description: 'Optional JSON string with additional transaction details',
              }
            },
            required: ['signature'],
          },
        },
        {
          name: 'analyze_address',
          description: 'Analyze a Solana address using Grok AI',
          inputSchema: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
                description: 'Solana address to analyze',
              },
              screenshot: {
                type: 'string',
                description: 'Optional base64 encoded screenshot of address data',
              }
            },
            required: ['address'],
          },
        },
        {
          name: 'analyze_image',
          description: 'Analyze an image using Grok AI vision capabilities',
          inputSchema: {
            type: 'object',
            properties: {
              image: {
                type: 'string',
                description: 'Base64 encoded image data',
              },
              prompt: {
                type: 'string',
                description: 'Question or prompt about the image',
              },
              image_url: {
                type: 'string',
                description: 'Optional URL of an image to analyze (alternative to base64)',
              }
            },
            required: ['prompt'],
          },
        },
        {
          name: 'ask_grok',
          description: 'Ask Grok a general question',
          inputSchema: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'Question to ask Grok',
              },
              context: {
                type: 'string',
                description: 'Optional context for the question',
              },
              image: {
                type: 'string',
                description: 'Optional base64 encoded image to include with the question',
              },
              image_url: {
                type: 'string',
                description: 'Optional URL of an image to include (alternative to base64)',
              }
            },
            required: ['question'],
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const args = request.params.arguments;
      
      if (request.params.name === 'analyze_transaction') {
        if (!args || typeof args.signature !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required signature parameter'
          );
        }
        return this.handleAnalyzeTransaction({
          signature: args.signature,
          screenshot: typeof args.screenshot === 'string' ? args.screenshot : undefined,
          details: typeof args.details === 'string' ? args.details : undefined
        });
      } else if (request.params.name === 'analyze_address') {
        if (!args || typeof args.address !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required address parameter'
          );
        }
        return this.handleAnalyzeAddress({
          address: args.address,
          screenshot: typeof args.screenshot === 'string' ? args.screenshot : undefined
        });
      } else if (request.params.name === 'analyze_image') {
        if (!args || typeof args.prompt !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required prompt parameter'
          );
        }
        return this.handleAnalyzeImage({
          prompt: args.prompt,
          image: typeof args.image === 'string' ? args.image : undefined,
          image_url: typeof args.image_url === 'string' ? args.image_url : undefined
        });
      } else if (request.params.name === 'ask_grok') {
        if (!args || typeof args.question !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required question parameter'
          );
        }
        return this.handleAskGrok({
          question: args.question,
          context: typeof args.context === 'string' ? args.context : undefined,
          image: typeof args.image === 'string' ? args.image : undefined,
          image_url: typeof args.image_url === 'string' ? args.image_url : undefined
        });
      } else {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }
    });
  }

  private async handleAnalyzeTransaction(args: {
    signature: string;
    screenshot?: string;
    details?: string;
  }) {
    try {
      const { signature, screenshot, details } = args;
      
      // Parse details if provided
      let detailsObj = {};
      if (details) {
        try {
          detailsObj = JSON.parse(details);
        } catch (err) {
          console.error("Error parsing details:", err);
        }
      }

      const systemPrompt = 
        "You are an expert Solana blockchain analyst. " +
        "Analyze the given transaction information and provide detailed insights. " +
        "Focus on what the transaction does, which programs it interacts with, and its overall purpose. " +
        "If applicable, mention any tokens transferred, their amounts, and the parties involved.";

      // Prepare user content
      const userContent: any[] = [];
      
      // Add text content
      let userPromptText = `Analyze this Solana transaction: ${signature}\n\n`;
      
      if (Object.keys(detailsObj).length > 0) {
        userPromptText += "Additional details:\n";
        for (const [key, value] of Object.entries(detailsObj)) {
          if (key !== 'signature') { // Avoid duplication
            userPromptText += `- ${key}: ${value}\n`;
          }
        }
      }
      
      userContent.push({
        type: "text",
        text: userPromptText
      });

      // Add screenshot if available
      if (screenshot) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${screenshot}`,
            detail: "high"
          }
        });
      }

      const messages = [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userContent
        }
      ];

      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: "grok-2-vision-latest",
          messages: messages,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: response.data.choices[0].message.content
          },
        ],
      };
    } catch (error: any) {
      console.error('Error in analyze_transaction:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing transaction: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleAnalyzeAddress(args: {
    address: string;
    screenshot?: string;
  }) {
    try {
      const { address, screenshot } = args;
      const content: any[] = [];
      
      // Add text content
      content.push({
        type: "text",
        text: `Analyze this Solana address: ${address}`
      });

      // Add screenshot if available
      if (screenshot) {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${screenshot}`,
            detail: "high"
          }
        });
      }

      const messages = [
        {
          role: "system",
          content: "You are an expert Solana blockchain analyst. Analyze the given address information and provide detailed insights."
        },
        {
          role: "user",
          content: content
        }
      ];

      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: "grok-2-vision-latest",
          messages: messages,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: response.data.choices[0].message.content
          },
        ],
      };
    } catch (error: any) {
      console.error('Error in analyze_address:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing address: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleAnalyzeImage(args: {
    image?: string;
    image_url?: string;
    prompt: string;
  }) {
    try {
      const { image, image_url, prompt } = args;
      
      // Prepare user content
      const userContent: any[] = [];
      
      // Add image
      if (image) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${image}`,
            detail: "high"
          }
        });
      } else if (image_url) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: image_url,
            detail: "high"
          }
        });
      }
      
      // Add prompt text
      userContent.push({
        type: "text",
        text: prompt
      });

      const messages = [
        {
          role: "system",
          content: "You are an advanced AI with powerful vision capabilities. Analyze the provided image and respond to the user's query in detail."
        },
        {
          role: "user",
          content: userContent
        }
      ];

      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: "grok-2-vision-latest",
          messages: messages,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: response.data.choices[0].message.content
          },
        ],
      };
    } catch (error: any) {
      console.error('Error in analyze_image:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing image: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleAskGrok(args: {
    question: string;
    context?: string;
    image?: string;
    image_url?: string;
  }) {
    try {
      const { question, context, image, image_url } = args;
      
      // Prepare user content
      const userContent: any[] = [];
      
      // Add image if provided
      if (image) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${image}`,
            detail: "high"
          }
        });
      } else if (image_url) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: image_url,
            detail: "high"
          }
        });
      }
      
      // Add text content
      userContent.push({
        type: "text",
        text: context ? `${context}\n\n${question}` : question
      });

      const messages = [
        {
          role: "system",
          content: "You are Grok, a helpful AI assistant with expertise in blockchain technology, especially Solana. You can also analyze images when provided."
        },
        {
          role: "user",
          content: userContent
        }
      ];

      // Determine which model to use based on whether image is provided
      const model = image || image_url ? "grok-2-vision-latest" : "grok-2-latest";

      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: model,
          messages: messages,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: response.data.choices[0].message.content
          },
        ],
      };
    } catch (error: any) {
      console.error('Error in ask_grok:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error asking Grok: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Grok AI MCP server running on stdio');
  }
}

const server = new GrokAIServer();
server.run().catch(console.error);
