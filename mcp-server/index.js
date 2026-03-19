import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod/v4';

const server = new McpServer({
    name: 'example-server',
    version: '1.0.0'
});

// Registrar una herramienta de ejemplo
server.registerTool(
    'example_tool',
    {
        description: 'Una herramienta de ejemplo que devuelve un saludo',
        inputSchema: z.object({
            name: z.string().optional().describe('Nombre opcional para el saludo')
        })
    },
    async ({ name }) => {
        const greeting = name ? `¡Hola, ${name}!` : '¡Hola desde el servidor MCP!';
        return {
            content: [
                {
                    type: 'text',
                    text: greeting
                }
            ]
        };
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Servidor MCP ejecutándose en stdio');
}

main().catch(console.error);