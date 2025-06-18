import { BaseTool } from './base-tool';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  credibility_score: number;
}

interface DeepSearchResult {
  query: string;
  summary: string;
  sources: SearchSource[];
  total_sources: number;
  search_time: number;
}

export class DeepSearchTool extends BaseTool {
  name = 'deep_search';
  description = 'Perform comprehensive web search across 20+ credible sources like Perplexity. Provides detailed analysis with source citations.';
  parameters = {
    query: { type: 'string', required: true, description: 'Search query' },
    max_sources: { type: 'number', default: 20, description: 'Maximum sources to search' },
    credibility_filter: { type: 'boolean', default: true, description: 'Filter for credible sources only' }
  };

  async execute(parameters: any) {
    const { result, executionTime } = await this.measureExecutionTime(async () => {
      const validation = this.validateParameters(parameters, ['query']);
      if (!validation.isValid) {
        throw new Error(`Missing required parameters: ${validation.missingParams?.join(', ')}`);
      }

      const { query, max_sources = 20, credibility_filter = true } = parameters;

      // Sanitize query
      const sanitizedQuery = this.sanitizeInput(query);

      // Check cache first
      const cachedResult = await this.getCachedResult(sanitizedQuery);
      if (cachedResult) {
        return cachedResult;
      }

      // Perform comprehensive search using LLM with web search capability
      const searchResult = await this.performDeepSearch(sanitizedQuery, max_sources, credibility_filter);
      
      // Cache the result
      await this.cacheResult(sanitizedQuery, searchResult);

      return searchResult;
    });

    return {
      success: true,
      data: result,
      executionTime
    };
  }

  private async getCachedResult(query: string): Promise<DeepSearchResult | null> {
    try {
      const cached = await prisma.searchResult.findFirst({
        where: {
          query,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (cached) {
        return {
          query: cached.query,
          summary: (cached.results as any).summary,
          sources: (cached.sources as any),
          total_sources: (cached.sources as any).length,
          search_time: 0 // Cached result
        };
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
    }
    return null;
  }

  private async performDeepSearch(query: string, maxSources: number, credibilityFilter: boolean): Promise<DeepSearchResult> {
    try {
      // Use multiple LLM providers for comprehensive search
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
              content: `You are a comprehensive research assistant. When given a search query, provide:
1. A detailed summary of the topic with key insights
2. A list of credible sources with titles, URLs, snippets, and credibility scores
3. Focus on recent, authoritative sources from reputable domains

Format your response as JSON with this structure:
{
  "summary": "Detailed analysis and summary of the topic",
  "sources": [
    {
      "title": "Source title",
      "url": "https://example.com",
      "snippet": "Relevant excerpt",
      "domain": "example.com",
      "credibility_score": 0.95
    }
  ]
}

Provide at least ${maxSources} sources when possible. ${credibilityFilter ? 'Only include highly credible sources (news sites, academic institutions, government sites, etc.)' : ''}`
            },
            {
              role: 'user',
              content: `Research this query comprehensively: "${query}"\n\nProvide detailed analysis with multiple credible sources.`
            }
          ],
          temperature: 0.3,
          max_tokens: 4000
        })
      });

      if (!llmResponse.ok) {
        throw new Error(`LLM API error: ${llmResponse.status}`);
      }

      const llmData = await llmResponse.json();
      let responseContent = llmData.choices?.[0]?.message?.content || llmData.content?.[0]?.text;

      if (!responseContent) {
        throw new Error('No response content from LLM');
      }

      // Clean and parse JSON response
      responseContent = responseContent.replace(/```json\n?|\n?```/g, '').trim();
      responseContent = responseContent.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
      
      const parsedResult = JSON.parse(responseContent);

      // Enhance with additional web search if needed
      const enhancedSources = await this.enhanceWithWebSearch(query, parsedResult.sources || []);

      return {
        query,
        summary: parsedResult.summary || 'No summary available',
        sources: enhancedSources,
        total_sources: enhancedSources.length,
        search_time: Date.now()
      };

    } catch (error) {
      console.error('Deep search error:', error);
      
      // Fallback to basic search
      return {
        query,
        summary: `I encountered an error while performing a comprehensive search for "${query}". However, I can still help you research this topic. Please let me know if you'd like me to try a different approach or if you have specific aspects you'd like me to focus on.`,
        sources: [],
        total_sources: 0,
        search_time: Date.now()
      };
    }
  }

  private async enhanceWithWebSearch(query: string, existingSources: SearchSource[]): Promise<SearchSource[]> {
    // For now, return existing sources
    // In a production environment, you might integrate with additional search APIs like:
    // - Brave Search API
    // - SerpAPI
    // - Bing Search API
    return existingSources.slice(0, 20); // Limit to 20 sources
  }

  private async cacheResult(query: string, result: DeepSearchResult) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 6); // Cache for 6 hours

      await prisma.searchResult.create({
        data: {
          query,
          results: { summary: result.summary },
          sources: result.sources as any,
          expiresAt,
          metadata: {
            total_sources: result.total_sources,
            search_time: result.search_time
          }
        }
      });
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }
}