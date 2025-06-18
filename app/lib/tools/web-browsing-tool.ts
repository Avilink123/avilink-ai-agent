import { BaseTool } from './base-tool';

interface WebBrowsingResult {
  url: string;
  title: string;
  content: string;
  metadata: {
    status_code: number;
    content_type: string;
    page_size: number;
    load_time: number;
    extracted_links?: string[];
    images?: string[];
  };
  analysis?: string;
}

export class WebBrowsingTool extends BaseTool {
  name = 'web_browsing';
  description = 'Browse web pages, extract content, and analyze web content. Can fetch page content, extract links, and provide analysis.';
  parameters = {
    url: { type: 'string', required: true, description: 'URL to browse and analyze' },
    action: { type: 'string', default: 'analyze', description: 'Action: analyze, extract_content, get_links, screenshot' },
    analyze_content: { type: 'boolean', default: true, description: 'Whether to provide AI analysis of the content' },
    specific_query: { type: 'string', description: 'Specific question or query about the web page' }
  };

  async execute(parameters: any) {
    const { result, executionTime } = await this.measureExecutionTime(async () => {
      const validation = this.validateParameters(parameters, ['url']);
      if (!validation.isValid) {
        throw new Error(`Missing required parameters: ${validation.missingParams?.join(', ')}`);
      }

      const { url, action = 'analyze', analyze_content = true, specific_query } = parameters;

      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL provided');
      }

      const browsingResult = await this.browseWebPage(url, action, analyze_content, specific_query);
      
      return browsingResult;
    });

    return {
      success: true,
      data: result,
      executionTime
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private async browseWebPage(url: string, action: string, analyzeContent: boolean, specificQuery?: string): Promise<WebBrowsingResult> {
    const startTime = Date.now();
    
    try {
      // Fetch the web page
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Avilink-AI-Agent/1.0 (Web Browsing Tool)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const content = await response.text();
      const loadTime = Date.now() - startTime;

      // Extract basic information
      const title = this.extractTitle(content);
      const textContent = this.extractTextContent(content);
      const links = action === 'get_links' ? this.extractLinks(content, url) : [];
      const images = this.extractImages(content, url);

      let analysis = '';
      if (analyzeContent && textContent) {
        analysis = await this.analyzeContent(textContent, url, specificQuery);
      }

      return {
        url,
        title,
        content: textContent,
        metadata: {
          status_code: response.status,
          content_type: contentType,
          page_size: content.length,
          load_time: loadTime,
          extracted_links: links,
          images: images.slice(0, 10) // Limit to first 10 images
        },
        analysis
      };

    } catch (error) {
      return {
        url,
        title: '',
        content: '',
        metadata: {
          status_code: 0,
          content_type: '',
          page_size: 0,
          load_time: Date.now() - startTime
        },
        analysis: `Error browsing ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : 'No title found';
  }

  private extractTextContent(html: string): string {
    // Remove script and style elements
    let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove HTML tags
    cleanHtml = cleanHtml.replace(/<[^>]+>/g, ' ');
    
    // Clean up whitespace
    cleanHtml = cleanHtml.replace(/\s+/g, ' ').trim();
    
    // Limit content length
    return cleanHtml.substring(0, 10000);
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      try {
        const href = match[1];
        const absoluteUrl = new URL(href, baseUrl).href;
        if (!links.includes(absoluteUrl)) {
          links.push(absoluteUrl);
        }
      } catch {
        // Skip invalid URLs
      }
    }

    return links.slice(0, 50); // Limit to first 50 links
  }

  private extractImages(html: string, baseUrl: string): string[] {
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images: string[] = [];
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      try {
        const src = match[1];
        const absoluteUrl = new URL(src, baseUrl).href;
        if (!images.includes(absoluteUrl)) {
          images.push(absoluteUrl);
        }
      } catch {
        // Skip invalid URLs
      }
    }

    return images;
  }

  private async analyzeContent(content: string, url: string, specificQuery?: string): Promise<string> {
    try {
      const analysisPrompt = specificQuery 
        ? `Analyze this web page content and answer this specific question: ${specificQuery}\n\nWeb page URL: ${url}\n\nContent: ${content.substring(0, 8000)}`
        : `Analyze this web page content. Provide a summary of the main topic, key points, and important information.\n\nWeb page URL: ${url}\n\nContent: ${content.substring(0, 8000)}`;

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
              content: 'You are a web content analyst. Analyze web pages and provide clear, structured summaries and insights.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (llmResponse.ok) {
        const llmData = await llmResponse.json();
        return llmData.choices?.[0]?.message?.content || llmData.content?.[0]?.text || 'Content analysis not available';
      }
    } catch (error) {
      console.error('Content analysis error:', error);
    }

    return 'Content analysis not available';
  }
}