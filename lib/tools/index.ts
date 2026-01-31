import { toolRegistry } from "./registry";
import { webSearchTool } from "./definitions/web-search";
import { weatherTool } from "./definitions/weather";
import { stockTool } from "./definitions/stock";
import { timeTool } from "./definitions/time";

// Register all tools
toolRegistry.register(webSearchTool);
toolRegistry.register(weatherTool);
toolRegistry.register(stockTool);
toolRegistry.register(timeTool);

export { toolRegistry };
