
import { GoogleGenAI } from "@google/genai";
import { Message, ChatConfig } from "../types";

class ApiService {
  private currentKeyIndex = 0;

  private getNextKey(keys: string[]): string | null {
    if (!keys || keys.length === 0) return null;
    const key = keys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % keys.length;
    return key;
  }

  async sendMessage(
    history: Message[],
    config: ChatConfig,
    onStream?: (text: string) => void
  ): Promise<string> {
    const activeKey = this.getNextKey(config.apiKeys);
    if (!activeKey) throw new Error("Missing API Key");

    // 如果设置了自定义 Base URL，走 OpenAI 兼容格式
    if (config.baseUrl && config.baseUrl.trim() !== "") {
      return this.sendOpenAiRequest(history, config, activeKey, onStream);
    }

    // 否则走原生 Gemini SDK
    return this.sendGeminiRequest(history, config, activeKey, onStream);
  }

  private async sendGeminiRequest(
    history: Message[],
    config: ChatConfig,
    apiKey: string,
    onStream?: (text: string) => void
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const genConfig = {
      model: config.modelName,
      contents: contents,
      config: {
        systemInstruction: config.systemInstruction,
        temperature: config.temperature,
      },
    };

    if (onStream) {
      const result = await ai.models.generateContentStream(genConfig);
      let fullText = "";
      for await (const chunk of result) {
        if (chunk.text) {
          fullText += chunk.text;
          onStream(fullText);
        }
      }
      return fullText;
    } else {
      const response = await ai.models.generateContent(genConfig);
      return response.text || "";
    }
  }

  private async sendOpenAiRequest(
    history: Message[],
    config: ChatConfig,
    apiKey: string,
    onStream?: (text: string) => void
  ): Promise<string> {
    const url = config.baseUrl.endsWith('/') ? `${config.baseUrl}chat/completions` : `${config.baseUrl}/chat/completions`;
    
    const messages = [
      { role: 'system', content: config.systemInstruction },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.content
      }))
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: messages,
        temperature: config.temperature,
        stream: !!onStream
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
    }

    if (onStream) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.includes('[DONE]')) break;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || "";
              fullText += content;
              onStream(fullText);
            } catch (e) {}
          }
        }
      }
      return fullText;
    } else {
      const data = await response.json();
      return data.choices[0]?.message?.content || "";
    }
  }
}

export const geminiService = new ApiService();
