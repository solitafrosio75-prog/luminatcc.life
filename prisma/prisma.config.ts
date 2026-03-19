// Configuración de Prisma 7 para SQLite
// - datasource.url: usado por Prisma CLI (migrate, db push, studio)
// - schema: ruta al schema Prisma
// - migrations.path: directorio de migraciones
import { defineConfig } from 'prisma/config';

export default defineConfig({
    schema: './schema.prisma',
    migrations: {
        path: './migrations',
    },
    datasource: {
        url: 'file:./dev.db',
    },
});
