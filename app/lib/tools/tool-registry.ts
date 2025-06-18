import { DeepSearchTool } from './deep-search-tool';
import { PythonExecutionTool } from './python-execution-tool';
import { FileProcessingTool } from './file-processing-tool';
import { WebBrowsingTool } from './web-browsing-tool';

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute(parameters: any): Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.registerBuiltinTools();
  }

  private registerBuiltinTools() {
    const builtinTools = [
      new DeepSearchTool(),
      new PythonExecutionTool(),
      new FileProcessingTool(),
      new WebBrowsingTool()
    ];

    builtinTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAvailableTools(): Array<{ name: string; description: string; parameters: Record<string, any> }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  unregisterTool(name: string) {
    this.tools.delete(name);
  }

  listTools(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolCount(): number {
    return this.tools.size;
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}