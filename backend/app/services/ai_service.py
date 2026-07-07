import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

AI_API_KEY = os.getenv("AI_API_KEY")
AI_MODEL = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")


def build_prompt(notes_text, question_count, difficulty, question_type): #prompt builder for groq api

    if question_type == "MCQ": #tells the ai 
        format_example = '''{
  "questions": [
    {
      "question_text": "What is X?",
      "question_type": "MCQ",
      "option_a": "Option A",
      "option_b": "Option B",
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_answer": "A",
      "explanation": "A is correct because...",
      "confidence_score": 0.92
    }
  ]
}'''
    elif question_type == "TRUE_FALSE":
        format_example = '''{
  "questions": [
    {
      "question_text": "This statement is true.",
      "question_type": "TRUE_FALSE",
      "option_a": "True",
      "option_b": "False",
      "option_c": null,
      "option_d": null,
      "correct_answer": "A",
      "explanation": "This is true because...",
      "confidence_score": 0.90
    }
  ]
}'''
    else:
        format_example = '''{
  "questions": [
    {
      "question_text": "Explain X briefly.",
      "question_type": "SHORT_ANSWER",
      "option_a": null,
      "option_b": null,
      "option_c": null,
      "option_d": null,
      "correct_answer": "A",
      "explanation": "The answer is...",
      "confidence_score": 0.85
    }
  ]
}'''

    return f"""You are a quiz generator for a learning platform.

Generate exactly {question_count} questions from the notes below.
Difficulty: {difficulty}
Type: {question_type}

Rules:
- Return ONLY valid JSON, no markdown, no extra text, no code blocks
- MCQ: fill option_a to option_d, correct_answer must be A B C or D
- TRUE_FALSE: option_a=True, option_b=False, correct_answer = A or B
- SHORT_ANSWER: options are null, explanation contains the answer
- Questions must be based on the notes only
- Write clear simple explanations

Notes:
{notes_text}

Return JSON in this exact format:
{format_example}"""


async def generate_questions(notes_text, question_count, difficulty, question_type):
    """
    Calls Groq API and returns list of validated question dicts.
    Groq is free and very fast.
    """
    prompt = build_prompt(notes_text, question_count, difficulty, question_type) #builds the prompt for ai model

    
    headers = {
        "Authorization": f"Bearer {AI_API_KEY}", #sends api key to groq
        "Content-Type": "application/json"    #sending data in json format
    }
#actual data which is sent to groq
    body = {
        "model": AI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are a quiz generator. Return only valid JSON. No markdown, no explanation outside JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 4000,
        "temperature": 0.7
    }
#request sent to groq using http client
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions", #groq's api endpoint
            headers=headers,
            json=body
        )

    if response.status_code != 200:
        raise Exception(f"Groq API error: {response.status_code} - {response.text}")

    result = response.json()

    raw_text = result["choices"][0]["message"]["content"]

    # clean markdown if added
    cleaned = raw_text.strip() #removes extra spaces at start and end
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
#converts json string to python object or dict
    parsed = json.loads(cleaned)
    questions = parsed.get("questions", [])
#checks if questions is a lis or not,if not raises an exception
    if not isinstance(questions, list):
        raise Exception("Groq returned invalid format")

    # validate each question
    validated = []
    for q in questions:
        if not q.get("question_text"):
            continue

        q_type = q.get("question_type", question_type)

        if q_type == "MCQ":
            if not all([q.get("option_a"), q.get("option_b"), q.get("option_c"), q.get("option_d")]):
                continue
            if q.get("correct_answer", "").upper() not in ["A", "B", "C", "D"]:
                continue

        q["correct_answer"] = q.get("correct_answer", "A").upper()
        validated.append(q)

    return validated