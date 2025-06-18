export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: Record<string, any>;

  abstract execute(parameters: any): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    executionTime?: number;
  }>;

  protected async measureExecutionTime<T>(operation: () => Promise<T>): Promise<{ result: T; executionTime: number }> {
    const startTime = Date.now();
    const result = await operation();
    const executionTime = Date.now() - startTime;
    return { result, executionTime };
  }

  protected validateParameters(parameters: any, required: string[]): { isValid: boolean; missingParams?: string[] } {
    const missingParams = required.filter(param => !(param in parameters) || parameters[param] === undefined);
    return {
      isValid: missingParams.length === 0,
      missingParams: missingParams.length > 0 ? missingParams : undefined
    };
  }

  protected sanitizeInput(input: string): string {
    // Basic input sanitization
    return input.replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    });
  }

  protected async handleError(error: any, context: string): Promise<{ success: false; error: string }> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`${this.name} tool error in ${context}:`, error);
    
    return {
      success: false,
      error: `${context}: ${errorMessage}`
    };
  }
}