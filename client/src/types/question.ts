export type QuestionType = "multiple" | "single" | "image" | "dragdrop";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  slotCount?: number; // Chỉ dành cho câu hỏi dragdrop
}