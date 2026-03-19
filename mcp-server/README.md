# Servidor MCP de Ejemplo

Este es un servidor básico de Model Context Protocol (MCP) creado con Node.js.

## Instalación

1. Asegúrate de tener Node.js instalado.
2. Ejecuta `npm install` para instalar las dependencias.

## Uso

Para ejecutar el servidor:

```bash
npm start
```

El servidor se ejecutará en stdio y estará listo para conectarse a un cliente MCP.

## Configuración en Cliente

Para usar este servidor en un cliente MCP (como VS Code con soporte MCP), configura la conexión stdio en la configuración del cliente.

Ejemplo de configuración (en settings.json de VS Code si aplica):

```json
{
  "mcp.servers": {
    "example-server": {
      "command": "node",
      "args": ["c:/Users/Sol/Desktop/tcc-lab/mcp-server/index.js"],
      "env": {}
    }
  }
}
```

## Desarrollo

Puedes modificar `index.js` para agregar más herramientas y funcionalidades según la documentación de MCP.