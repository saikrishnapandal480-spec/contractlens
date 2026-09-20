import os
from litellm import completion
from dotenv import load_dotenv
import json

load_dotenv()

def extract_contract_info(text: str) -> dict:
    """
    Calls the AI model to extract contract data.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("No AI API Key provided. Using fallback demo mode.")
        return {
            "parties": "Demo Company A, Demo Company B",
            "effective_date": "2023-01-01",
            "expiration_date": "2024-01-01",
            "renewal_terms": "Auto-renews annually",
            "payment_terms": "Net 30",
            "termination_conditions": "30 days written notice",
            "service_obligations": "Provide SaaS platform access",
            "obligations": [
                {
                    "party": "Demo Company A",
                    "obligation": "Pay invoice",
                    "due_date": "2023-02-01",
                    "priority": "High",
                    "status": "Pending",
                    "recurrence": "Monthly",
                    "source_reference": "Section 3.1",
                    "requires_human_review": False
                }
            ],
            "review_flags": [
                {
                    "clause": "Unlimited Liability",
                    "reason": "Risk of infinite damages",
                    "severity": "High",
                    "source_reference": "Section 9",
                    "status": "Open"
                }
            ]
        }
    
    prompt = f"""
    Extract the following from the contract text:
    Parties, Effective Date, Expiration Date, Renewal Terms, Payment Terms, Termination Conditions, Service Obligations.
    Also extract a list of obligations (party, obligation, due_date, priority, status, recurrence, source_reference, requires_human_review).
    Also extract review flags (clause, reason, severity, source_reference).
    
    Respond in JSON format.
    
    TEXT:
    {text[:4000]} # Trim for demo
    """
    
    try:
        response = completion(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"AI Extraction failed: {e}")
        return {}


def ask_contract_question(contract_text: str, question: str) -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {
            "answer": "This is a demo answer since no AI key is provided.",
            "source_reference": "Section 1.1 Demo"
        }
    
    prompt = f"""
    Answer the following question based ONLY on the provided contract text.
    If the answer is not in the text, say "I cannot find the answer in the contract."
    Provide a specific source reference (e.g. section, page) where you found the answer.
    
    Question: {question}
    
    Contract Text:
    {contract_text[:8000]}
    
    Respond in JSON format: {{"answer": "...", "source_reference": "..."}}
    """
    
    try:
        response = completion(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"AI Q&A failed: {e}")
        return {"answer": "Error occurred during AI processing.", "source_reference": None}


def compare_contracts(text1: str, text2: str) -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {
            "added": ["New confidentiality clause added."],
            "removed": ["Old payment terms removed."],
            "modified": ["Termination notice changed from 30 to 60 days."],
            "important_changes": ["Increased liability risk in new version."]
        }
        
    prompt = f"""
    Compare the following two versions of a contract and extract:
    1. Added clauses
    2. Removed clauses
    3. Modified clauses
    4. Important changes
    
    Version 1:
    {text1[:4000]}
    
    Version 2:
    {text2[:4000]}
    
    Respond in JSON format: {{"added": ["..."], "removed": ["..."], "modified": ["..."], "important_changes": ["..."]}}
    """
    
    try:
        response = completion(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"AI Compare failed: {e}")
        return {"added": [], "removed": [], "modified": [], "important_changes": ["Error occurred during comparison."]}
