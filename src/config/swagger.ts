import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        title: "My Express API",
        description: "Auto-generated API documentation",
        version: "1.0.0",
    },
    host: "localhost:3000",
    schemes: ["http"],
};

const outputFile = "./swagger-output.json";

// IMPORTANT: point to app.ts (not server.ts)
const endpointsFiles = ["./src/app.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);