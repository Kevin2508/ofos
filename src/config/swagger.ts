import swaggerAutogen from "swagger-autogen";
import { generateSchemas } from "./swagger-generate-schemas.ts";

const doc: any = {
    info: {
        title: "API",
        description: "API docs",
        version: "1.0.0"
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Local server"
        }
    ],
    components: {
        '@schemas': {}
    }
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/app.ts"];

const swagger = swaggerAutogen({ openapi: '3.0.0' });

export const generateSwagger = async () => {
    const schemas = await generateSchemas();
    doc.components['@schemas'] = schemas;

    const originalLog = console.log;

    // silence swagger-autogen logs
    console.log = () => { };

    try {
        await swagger(outputFile, endpointsFiles, doc);
    } finally {
        // restore logs
        console.log = originalLog;
    }
};

// Execute if run directly
const scriptPath = process.argv[1];
const isMainModule = scriptPath && import.meta.url.startsWith('file:') && scriptPath === new URL(import.meta.url).pathname;
if (isMainModule || (scriptPath && scriptPath.endsWith('swagger.ts'))) {
    generateSwagger().then(() => console.log('Swagger documentation generated successfully.'));
}