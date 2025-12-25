
import { GoogleGenAI, Type } from "@google/genai";
import { AIRiskResult, Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const analyzeTaskRisk = async (task: Task): Promise<AIRiskResult> => {
  const prompt = `Bạn là Project Guardian AI - một trợ lý quản lý dự án cấp cao. 
  Hệ thống phát hiện Task sau đang TRỄ HẠN:
  - Tên Task: "${task.title}"
  - Người thực hiện: ${task.assignee.name}
  - Deadline: ${task.deadline}
  - Độ ưu tiên: ${task.priority}

  Hãy phân tích rủi ro hệ thống và đưa ra giải pháp quyết liệt. 
  Yêu cầu định dạng JSON với các trường:
  1. risk: Rủi ro thực tế (ví dụ: ảnh hưởng tiến độ chung, cháy ngân sách).
  2. solution: Bước hành động cụ thể cho ${task.assignee.name}.
  3. reminder: Lời nhắc nhở chuyên nghiệp.
  4. severity: 'Warning' hoặc 'Critical' dựa trên độ ưu tiên.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          risk: { type: Type.STRING },
          solution: { type: Type.STRING },
          reminder: { type: Type.STRING },
          severity: { 
            type: Type.STRING,
            enum: ['Warning', 'Critical']
          },
        },
        required: ["risk", "solution", "reminder", "severity"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as AIRiskResult;
  } catch (error) {
    return {
      risk: "Rủi ro trễ tiến độ dây chuyền cho toàn dự án.",
      solution: "Tổ chức họp khẩn với team kỹ thuật để tháo gỡ khó khăn.",
      reminder: "Sự minh bạch trong tiến độ là ưu tiên hàng đầu.",
      severity: 'Critical'
    };
  }
};
