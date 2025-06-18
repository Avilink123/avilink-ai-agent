import { BaseTool } from './base-tool';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';

const prisma = new PrismaClient();

interface FileProcessingResult {
  filename: string;
  content_type: string;
  extracted_text?: string;
  analysis: string;
  metadata: Record<string, any>;
  processing_method: string;
}

export class FileProcessingTool extends BaseTool {
  name = 'file_processing';
  description = 'Process and analyze various file types including PDF, Word, Excel, images, and more using AI analysis.';
  parameters = {
    file_path: { type: 'string', required: true, description: 'Path to the file to process' },
    analysis_type: { type: 'string', default: 'comprehensive', description: 'Type of analysis: comprehensive, summary, extraction' },
    specific_query: { type: 'string', description: 'Specific question or query about the file content' }
  };

  async execute(parameters: any) {
    const { result, executionTime } = await this.measureExecutionTime(async () => {
      const validation = this.validateParameters(parameters, ['file_path']);
      if (!validation.isValid) {
        throw new Error(`Missing required parameters: ${validation.missingParams?.join(', ')}`);
      }

      const { file_path, analysis_type = 'comprehensive', specific_query } = parameters;

      // Get file info from database
      const fileRecord = await this.getFileRecord(file_path);
      if (!fileRecord) {
        throw new Error('File not found in database');
      }

      // Process file using LLM API
      const processingResult = await this.processFileWithLLM(fileRecord, analysis_type, specific_query);
      
      // Update file record with processing results
      await this.updateFileRecord(fileRecord.id, processingResult);

      return processingResult;
    });

    return {
      success: true,
      data: result,
      executionTime
    };
  }

  private async getFileRecord(filePath: string) {
    try {
      // Try to find by exact path first
      let fileRecord = await prisma.file.findFirst({
        where: { path: filePath }
      });

      // If not found, try to find by filename
      if (!fileRecord) {
        const filename = filePath.split('/').pop() || filePath;
        fileRecord = await prisma.file.findFirst({
          where: { filename }
        });
      }

      return fileRecord;
    } catch (error) {
      console.error('Database query error:', error);
      return null;
    }
  }

  private async processFileWithLLM(fileRecord: any, analysisType: string, specificQuery?: string): Promise<FileProcessingResult> {
    try {
      // Read file content
      const fileBuffer = await readFile(fileRecord.path);
      const mimeType = fileRecord.mimeType;

      // For text files, extract content directly
      let extractedText = null;
      if (mimeType.startsWith('text/') || mimeType === 'application/json') {
        extractedText = fileBuffer.toString('utf-8');
      }

      // Prepare analysis prompt based on type
      let analysisPrompt = this.getAnalysisPrompt(analysisType, specificQuery);

      // For text files, include content in prompt
      if (extractedText) {
        analysisPrompt += `\n\nFile content:\n${extractedText.substring(0, 8000)}`;
      }

      // Call LLM API for analysis
      const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.DEEPSEEK_API_KEY;
      const apiUrl = process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1/chat/completions' : 'https://api.anthropic.com/v1/messages';
      
      const llmResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_API_KEY ? 'gpt-4' : 'claude-3-sonnet-20240229',
          messages: [
            {
              role: 'system',
              content: 'You are an expert file analyst. Provide detailed, structured analysis of files. Extract key information, summarize content, and answer specific questions when asked.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4000
        })
      });

      let analysis = 'Analysis not available';
      if (llmResponse.ok) {
        const llmData = await llmResponse.json();
        analysis = llmData.choices?.[0]?.message?.content || llmData.content?.[0]?.text || 'Analysis not available';
      }

      return {
        filename: fileRecord.originalName,
        content_type: mimeType,
        extracted_text: extractedText || undefined,
        analysis,
        metadata: {
          file_size: fileRecord.size,
          processing_date: new Date().toISOString(),
          analysis_type: analysisType,
          specific_query: specificQuery
        },
        processing_method: 'llm_analysis'
      };

    } catch (error) {
      console.error('File processing error:', error);
      
      return {
        filename: fileRecord.originalName,
        content_type: fileRecord.mimeType,
        analysis: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}. The file type ${fileRecord.mimeType} might not be supported for this type of analysis.`,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          processing_date: new Date().toISOString()
        },
        processing_method: 'error'
      };
    }
  }

  private getAnalysisPrompt(analysisType: string, specificQuery?: string): string {
    const basePrompt = `Please analyze this file thoroughly and provide a detailed response.`;
    
    switch (analysisType) {
      case 'summary':
        return `${basePrompt} Focus on providing a concise but comprehensive summary of the main content, key points, and important information.`;
      
      case 'extraction':
        return `${basePrompt} Extract and organize all the key data, facts, figures, and structured information from this file.`;
      
      case 'comprehensive':
        return `${basePrompt} Provide a comprehensive analysis including:
1. Document overview and type
2. Main content summary
3. Key data and information
4. Important insights or conclusions
5. Structure and organization
6. Any notable features or characteristics`;
      
      default:
        const prompt = specificQuery 
          ? `${basePrompt} Pay special attention to this question: ${specificQuery}`
          : basePrompt;
        return prompt;
    }
  }

  private async updateFileRecord(fileId: string, processingResult: FileProcessingResult) {
    try {
      await prisma.file.update({
        where: { id: fileId },
        data: {
          status: 'processed',
          processedAt: new Date(),
          metadata: {
            ...processingResult.metadata,
            analysis: processingResult.analysis,
            processing_method: processingResult.processing_method
          }
        }
      });
    } catch (error) {
      console.error('Failed to update file record:', error);
    }
  }
}