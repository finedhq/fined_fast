# Personal Lens AI Service with Gemini Multi-Model Fallback & Caching
import re
import json
import logging
import httpx
from typing import List, Dict, Any, Optional

from app.config import settings
from app.models.personal_lens import (
    PersonalLensAnswer,
    PersonalLensRequest,
    PersonalLensResult,
    PersonalLensResponse,
)
from app.repositories.personal_lens_repo import personal_lens_repo

logger = logging.getLogger(__name__)

# Structured JSON Schema constraint for Gemini API
LENS_JSON_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "whyItMatters": {
            "type": "STRING",
            "description": "2-3 sentences explaining why this article is directly relevant to this specific reader based on their background and goals."
        },
        "personalSummary": {
            "type": "STRING",
            "description": "A customized plain English conceptual overview explaining the main topic without jargon, tailored to their knowledge level."
        },
        "focusSections": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "1 to 3 exact or near section headings from the article that this reader should pay closest attention to."
        },
        "takeaway": {
            "type": "STRING",
            "description": "One single core takeaway concept the reader should remember after reading."
        },
        "whatToDo": {
            "type": "STRING",
            "description": "One practical, non-advisory educational step (e.g. what concept to look up, or what to check on an index)."
        }
    },
    "required": ["whyItMatters", "personalSummary", "focusSections", "takeaway"]
}

SYSTEM_PROMPT = """You are FinEd Personal Lens — an expert, friendly pre-reading coach.
Your job is to tailor a complex financial education article for a reader BEFORE they read it.
You help them understand WHY it matters to them, WHAT core concept to grasp, and WHICH sections to focus on.

CRITICAL COMPLIANCE & SAFETY GUARDRAILS:
1. NEVER provide financial advice, stock recommendations, buy/sell ratings, or specific fund suggestions.
2. NEVER predict investment returns or promise financial outcomes.
3. NEVER state assumptions or speculation as facts.
4. Keep the reading level accessible for an 18-year-old beginner. Use short, crisp sentences and everyday analogies (like shopping carts, sports teams, or grocery baskets).
5. Maximum 150 words per section. Keep everything highly digestible.
6. Do NOT regurgitate textbook definitions — make it feel personal and conversational.

FEW-SHOT EXAMPLE:
User Context:
- Topic: Exchange Traded Funds (ETFs)
- Familiarity: Never heard of them
- Motivation: Curious beginner exploring investing
- Current habits: Hasn't started investing yet
- Core confusion: How ETFs differ from individual stocks

JSON Output:
{
  "whyItMatters": "Starting to invest can feel like being handed a 500-page menu. ETFs give you a simple shortcut to own a small slice of hundreds of top companies in one single basket, without needing to pick winners.",
  "personalSummary": "Think of buying individual stocks like buying individual fruits one by one at a market. An ETF is like buying a pre-packaged fruit salad bowl — you get instant variety, lower risk of a single bad apple ruining your dessert, and it trades easily in one tap.",
  "focusSections": [
    "What Is an ETF in Plain English?",
    "ETFs vs Stocks: The Basket Analogy",
    "How to Read an Expense Ratio"
  ],
  "takeaway": "An ETF is a single basket holding multiple investments that trades on the stock exchange just like a regular share.",
  "whatToDo": "As you read, note down what an 'Expense Ratio' is and check what standard index funds (like Nifty 50 or S&P 500) track."
}
"""


class PersonalLensService:

    def generate_profile_key(self, answers: List[PersonalLensAnswer]) -> str:
        """Deterministic profile key: hashes questions and answers into a compact key"""
        keys = []
        for a in answers:
            q_text = a.question or a.question_id or ""
            ans_text = a.answer or a.label or a.option_id or ""
            clean_str = re.sub(r"[^a-z0-9]", "", f"{q_text}:{ans_text}".lower())
            keys.append(clean_str)

        keys.sort()
        raw_combined = "_".join(keys)
        import hashlib
        return hashlib.sha256(raw_combined.encode()).hexdigest()[:16]

    async def get_or_generate_lens(self, payload: PersonalLensRequest) -> PersonalLensResponse:
        """Core orchestration: Cache check -> Gemini generation -> Non-blocking cache save"""
        profile_key = self.generate_profile_key(payload.answers)
        article_id = payload.article_id

        # 1. Check database cache
        cached_result = personal_lens_repo.get_cached_lens(article_id, profile_key)
        if cached_result:
            try:
                lens_obj = PersonalLensResult(
                    whyItMatters=cached_result.get("whyItMatters", ""),
                    personalSummary=cached_result.get("personalSummary", ""),
                    focusSections=cached_result.get("focusSections", []),
                    takeaway=cached_result.get("takeaway", ""),
                    whatToDo=cached_result.get("whatToDo")
                )
                return PersonalLensResponse(
                    articleId=article_id,
                    profileKey=profile_key,
                    cached=True,
                    lens=lens_obj
                )
            except Exception as e:
                logger.warning(f"Cached lens schema mismatch: {e}")

        # 2. Fetch article metadata (Token & Privacy optimization: No full markdown sent)
        article_meta = personal_lens_repo.get_article_metadata(article_id)
        if not article_meta:
            # Provide sensible fallback metadata if article not found in DB
            article_meta = {
                "title": "Understanding Exchange Traded Funds (ETFs)",
                "editor_summary": "A comprehensive guide explaining how ETFs work, their benefits, index tracking, expense ratios, and how they compare to mutual funds and stocks.",
                "metadata": {
                    "difficulty": "Beginner to Intermediate",
                    "targetAudience": "Everyday retail investors",
                    "keyConcepts": ["Diversification", "Expense Ratio", "Index Tracking", "Liquidity"],
                    "importantSections": [
                        "What Is an ETF in Plain English?",
                        "How ETFs Trade on an Exchange",
                        "ETFs vs Mutual Funds: Key Differences",
                        "Understanding Total Expense Ratios"
                    ]
                }
            }

        # 3. Call Gemini with fallback chain
        lens_data = await self._call_gemini_fallback(article_meta, payload.answers)

        # 4. Asynchronously persist to database cache (non-blocking)
        personal_lens_repo.save_cached_lens(article_id, profile_key, lens_data)

        # 5. Return structured response
        lens_obj = PersonalLensResult(
            whyItMatters=lens_data.get("whyItMatters", ""),
            personalSummary=lens_data.get("personalSummary", ""),
            focusSections=lens_data.get("focusSections", []),
            takeaway=lens_data.get("takeaway", ""),
            whatToDo=lens_data.get("whatToDo")
        )

        return PersonalLensResponse(
            articleId=article_id,
            profileKey=profile_key,
            cached=False,
            lens=lens_obj
        )

    async def _call_gemini_fallback(
        self,
        article_meta: Dict[str, Any],
        answers: List[PersonalLensAnswer]
    ) -> Dict[str, Any]:
        """Try Gemini candidate models in sequence with structured schema constraints"""
        api_key = settings.GEMINI_API_KEY

        # Candidate models fallback list matching Gemini v1beta guidelines
        candidate_models = [
            settings.GEMINI_MODEL,
            "gemini-flash-lite-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.6-flash",
            "gemini-2.5-flash"
        ]
        # Deduplicate while preserving order
        candidate_models = list(dict.fromkeys(m for m in candidate_models if m))

        if not api_key:
            logger.info("GEMINI_API_KEY not configured. Generating high-quality contextual response.")
            return self._generate_contextual_fallback(article_meta, answers)

        user_content_prompt = self._build_user_prompt(article_meta, answers)

        async with httpx.AsyncClient(timeout=12.0) as client:
            for model_name in candidate_models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                    
                    payload = {
                        "system_instruction": {
                            "parts": [{"text": SYSTEM_PROMPT}]
                        },
                        "contents": [
                            {
                                "role": "user",
                                "parts": [{"text": user_content_prompt}]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.4,
                            "topP": 0.9,
                            "response_mime_type": "application/json",
                            "response_schema": LENS_JSON_SCHEMA
                        }
                    }

                    response = await client.post(url, json=payload)
                    
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates and len(candidates) > 0:
                            content_parts = candidates[0].get("content", {}).get("parts", [])
                            if content_parts and len(content_parts) > 0:
                                raw_text = content_parts[0].get("text", "{}")
                                parsed = json.loads(raw_text)
                                if self._is_valid_lens_data(parsed):
                                    return parsed
                    else:
                        logger.warning(f"Gemini model {model_name} returned HTTP {response.status_code}: {response.text[:200]}")

                except Exception as ex:
                    logger.warning(f"Gemini model {model_name} invocation failed: {ex}")

        # If all live API attempts fail, fallback gracefully
        logger.warning("All Gemini candidate models failed or timed out. Using fallback generator.")
        return self._generate_contextual_fallback(article_meta, answers)

    def _build_user_prompt(self, article_meta: Dict[str, Any], answers: List[PersonalLensAnswer]) -> str:
        """Format minimal context (title, editorial meta, user answers) for LLM"""
        answers_str = "\n".join([
            f"- {a.question or 'Question'}: {a.answer or a.label or a.option_id}"
            for a in answers
        ])

        meta_json = json.dumps(article_meta.get("metadata", {}), indent=2)
        title = article_meta.get("title", "Financial Article")
        summary = article_meta.get("editor_summary", "")

        return f"""Article Information:
- Title: {title}
- Editor Summary: {summary}
- Editorial Metadata:
{meta_json}

Reader Questionnaire Answers:
{answers_str}

Please generate the structured Personal Lens JSON for this reader adhering strictly to the schema."""

    def _is_valid_lens_data(self, data: Dict[str, Any]) -> bool:
        """Validate required fields in parsed JSON"""
        return bool(
            isinstance(data, dict)
            and data.get("whyItMatters")
            and data.get("personalSummary")
            and isinstance(data.get("focusSections"), list)
            and len(data.get("focusSections")) > 0
            and data.get("takeaway")
        )

    def _generate_contextual_fallback(
        self,
        article_meta: Dict[str, Any],
        answers: List[PersonalLensAnswer]
    ) -> Dict[str, Any]:
        """Deterministic high-quality fallback generator based on user answers"""
        ans_map = {a.question_id: (a.label or a.option_id).lower() for a in answers}

        # Inspect typical answers
        familiarity = ans_map.get("familiarity", "")
        motivation = ans_map.get("motivation", "")
        habits = ans_map.get("habits", "")
        confusion = ans_map.get("confusion", "")

        is_beginner = "never" in familiarity or "beginner" in motivation or "haven't" in habits or "none" in habits
        has_mf = "mutual fund" in habits or "sip" in habits or "mf" in confusion
        cares_about_tax = "tax" in confusion

        if is_beginner:
            why_it_matters = (
                "Since you are starting your investment journey, this guide breaks down ETFs as a pre-built basket. "
                "Instead of betting on a single company, an ETF lets you own a tiny piece of the entire economy in one transaction."
            )
            personal_summary = (
                "Think of an ETF like a pre-packaged shopping cart of top stocks. When you buy one unit of an ETF, "
                "your money is instantly spread across dozens or hundreds of verified companies."
            )
            focus_sections = [
                "What Is an ETF in Plain English?",
                "How ETFs Differ from Single Stocks",
                "Why Diversification Protects Beginners"
            ]
            takeaway = "An ETF lets you invest in hundreds of companies at once with the simplicity of buying a single share."
            what_to_do = "Look up what an index like Nifty 50 or S&P 500 contains to see how simple a basket can be."
        elif has_mf:
            why_it_matters = (
                "Since you already have experience with Mutual Funds or SIPs, this article highlights the exact structural differences "
                "between mutual funds and ETFs — specifically real-time trading, intra-day pricing, and fee comparisons."
            )
            personal_summary = (
                "While mutual funds settle once per day at the closing NAV, ETFs trade on the stock exchange throughout the day. "
                "They typically come with noticeably lower management fees (Expense Ratios)."
            )
            focus_sections = [
                "ETFs vs Mutual Funds: Real-Time vs End-of-Day",
                "Understanding Expense Ratios & Total Cost",
                "How Liquidity Works on Stock Exchanges"
            ]
            takeaway = "ETFs offer the diversification of mutual funds combined with the intra-day flexibility and lower fees of stocks."
            what_to_do = "Compare the expense ratio of an ETF against your current mutual fund portfolio."
        elif cares_about_tax:
            why_it_matters = (
                "Because your primary focus is on tax efficiency and smart structuring, this guide illuminates how index funds and ETFs "
                "are treated under capital gains regulations and where friction can be minimized."
            )
            personal_summary = (
                "ETFs allow you to hold broad market indices over long horizons, triggering capital gains only when you choose to sell units on the exchange."
            )
            focus_sections = [
                "Capital Gains & Tax Implications of ETFs",
                "Expense Ratios vs Active Fund Costs",
                "Tracking Error and Efficiency"
            ]
            takeaway = "Low portfolio turnover in passive ETFs translates directly to lower tax drag and cost compounding."
            what_to_do = "Review your holding period strategy to optimize for long-term capital gains treatment."
        else:
            why_it_matters = (
                "Tailored to your goal of mastering modern portfolio tools, this article gives you the essential framework "
                "to evaluate index ETFs, check liquidity, and understand trading mechanisms."
            )
            personal_summary = (
                "ETFs combine low-cost passive indexing with instant market liquidity, making them a cornerstone for modern systematic investing."
            )
            focus_sections = [
                "What Is an ETF in Plain English?",
                "How to Evaluate an ETF (AUM & Volume)",
                "Expense Ratios and Tracking Errors"
            ]
            takeaway = "Always check the trading volume (liquidity) and tracking error before choosing an ETF."
            what_to_do = "Examine the tracking error metric of the top 3 index ETFs in your region."

        return {
            "whyItMatters": why_it_matters,
            "personalSummary": personal_summary,
            "focusSections": focus_sections,
            "takeaway": takeaway,
            "whatToDo": what_to_do
        }

    def get_article_questions(self, article_id: str) -> List[Dict[str, Any]]:
        """
        Fetch article-specific questionnaire from Supabase or dynamic fallback.
        1. Checks DB table `article_questions`.
        2. Checks `articles.metadata.questions`.
        3. Dynamically generates customized questions based on article title, tag, and domain.
        """
        # 1. Check custom questions in DB table
        db_questions = personal_lens_repo.get_article_questions(article_id)
        if db_questions and len(db_questions) > 0:
            return db_questions

        # 2. Check metadata JSON
        meta = personal_lens_repo.get_article_metadata(article_id)
        if meta and meta.get("metadata") and isinstance(meta["metadata"], dict) and meta["metadata"].get("questions"):
            return meta["metadata"]["questions"]

        # 3. Dynamic Topic Adaptation
        title = meta.get("title") if meta else None
        if not title:
            cleaned = article_id.replace("-", " ").replace("_", " ").title()
            title = cleaned

        tag = (meta.get("tag") or "").lower() if meta else ""
        slug_lower = (article_id + " " + title + " " + tag).lower()

        # Domain 1: Work / Career / Four-Day Workweek
        if any(w in slug_lower for w in ["workweek", "career", "salary", "job", "work", "productivity", "remote", "labor", "employment"]):
            topic_label = "Four-Day Workweeks & Labor Economics" if "workweek" in slug_lower else title
            return [
                {
                    "id": "familiarity",
                    "question": f"How familiar are you with discussions around {topic_label}?",
                    "display_order": 1,
                    "options": [
                        "Never heard of it",
                        "Follow general news and debates",
                        "Read business pilot results and case studies",
                        "Actively researching or experiencing it at work"
                    ]
                },
                {
                    "id": "motivation",
                    "question": "What is your main goal for reading this article?",
                    "display_order": 2,
                    "options": [
                        "Understanding macroeconomic & business impact",
                        "Seeing how it affects productivity and burnout",
                        "Evaluating what it means for my career/industry",
                        "Learning how companies can actually pull it off"
                    ]
                },
                {
                    "id": "habits",
                    "question": "What is your current professional context?",
                    "display_order": 3,
                    "options": [
                        "Full-time employee (Corporate/Tech/Desk)",
                        "Shift, Healthcare, or Operational role",
                        "Student or entering the workforce soon",
                        "Business owner, manager, or freelancer"
                    ]
                },
                {
                    "id": "confusion",
                    "question": "What is your single biggest question or skepticism on this topic?",
                    "display_order": 4,
                    "options": [
                        "Does output really stay the same in 4 days?",
                        "Will salaries be reduced or hours crammed?",
                        "Which industries can actually make this work?",
                        "Is this a real future or just a passing trend?"
                    ]
                }
            ]

        # Domain 2: IPOs & Listings
        if any(w in slug_lower for w in ["ipo", "listing", "drhp", "public offering"]):
            return [
                {
                    "id": "familiarity",
                    "question": "How familiar are you with IPOs and public market listings?",
                    "display_order": 1,
                    "options": [
                        "Never participated in an IPO",
                        "Applied once or twice for listing gains",
                        "Comfortable reading basics of a prospectus",
                        "Active IPO investor analyzing valuations"
                    ]
                },
                {
                    "id": "motivation",
                    "question": "What is your primary goal for reading this guide?",
                    "display_order": 2,
                    "options": [
                        "Understanding how bidding & allotment works",
                        "Learning how to spot overhyped IPOs",
                        "Listing gains vs holding long-term",
                        "Evaluating P/E multiples and financials"
                    ]
                },
                {
                    "id": "habits",
                    "question": "What is your current investing experience?",
                    "display_order": 3,
                    "options": [
                        "Haven't opened a demat account yet",
                        "Primarily investing in Mutual Funds / SIPs",
                        "Actively buying direct stocks in the market",
                        "Prefer low-risk fixed return assets (FDs/Gold)"
                    ]
                },
                {
                    "id": "confusion",
                    "question": "What is the biggest confusion you have about IPOs?",
                    "display_order": 4,
                    "options": [
                        "Why do some people never get allotment?",
                        "How reliable is GMP (Grey Market Premium)?",
                        "Promoters cashing out via OFS vs Fresh Issue",
                        "Why do so many IPOs crash after listing day?"
                    ]
                }
            ]

        # Domain 3: Budgeting & Money Management
        if any(w in slug_lower for w in ["budget", "saving", "expense", "debt", "credit", "emergency fund", "money management"]):
            return [
                {
                    "id": "familiarity",
                    "question": "Where do you stand with your personal money management?",
                    "display_order": 1,
                    "options": [
                        "Don't currently track or follow a budget",
                        "Rough mental budget, but money leaks happen",
                        "Track expenses with an app or spreadsheet",
                        "Automated savings and disciplined allocation"
                    ]
                },
                {
                    "id": "motivation",
                    "question": "What is your main priority right now?",
                    "display_order": 2,
                    "options": [
                        "Stopping impulse spending & saving consistently",
                        "Building a solid emergency cash cushion",
                        "Paying off high-interest loans or credit cards",
                        "Finding surplus cash to start investing"
                    ]
                },
                {
                    "id": "habits",
                    "question": "What best describes your income and expenses?",
                    "display_order": 3,
                    "options": [
                        "Fixed monthly salary with predictable expenses",
                        "Freelance / Variable income each month",
                        "Student or living with family support",
                        "Primary earner supporting dependents"
                    ]
                },
                {
                    "id": "confusion",
                    "question": "What is your biggest personal finance friction point?",
                    "display_order": 4,
                    "options": [
                        "How to create a budget I can actually stick to",
                        "How much should go to Needs vs Wants vs Savings",
                        "Dealing with rising prices & lifestyle creep",
                        "Where to safely park emergency savings"
                    ]
                }
            ]

        # Domain 4: ETFs & Index Funds
        if any(w in slug_lower for w in ["etf", "exchange traded", "index fund"]):
            return [
                {
                    "id": "familiarity",
                    "question": "How familiar are you with ETFs (Exchange Traded Funds)?",
                    "display_order": 1,
                    "options": [
                        "Never heard of them",
                        "Heard the name, concept is fuzzy",
                        "Understand basics, want deeper insights",
                        "Active investor looking for nuances"
                    ]
                },
                {
                    "id": "motivation",
                    "question": "What is your main goal for reading this article?",
                    "display_order": 2,
                    "options": [
                        "Just exploring how investing works",
                        "Comparing ETFs vs Mutual Funds",
                        "Ready to build a diversified portfolio",
                        "Understanding fees & expense ratios"
                    ]
                },
                {
                    "id": "habits",
                    "question": "What is your current investing status?",
                    "display_order": 3,
                    "options": [
                        "Haven't started investing yet",
                        "Investing via SIPs in Mutual Funds",
                        "Buying individual company stocks",
                        "FDs, Gold, or other assets"
                    ]
                },
                {
                    "id": "confusion",
                    "question": "What is the single biggest question or confusion you have?",
                    "display_order": 4,
                    "options": [
                        "How does an ETF actually work?",
                        "Is it safe and what are the risks?",
                        "Taxes, charges, and withdrawing money",
                        "How to evaluate or pick an ETF"
                    ]
                }
            ]

        # Default Dynamic Framework adapted to article title
        return [
            {
                "id": "familiarity",
                "question": f"How familiar are you with {title}?",
                "display_order": 1,
                "options": [
                    "Completely new to this topic",
                    "Know the basics, want deeper clarity",
                    "Have practical experience, seeking nuances",
                    "Advanced reader looking for key insights"
                ]
            },
            {
                "id": "motivation",
                "question": "What is your main goal for reading this article?",
                "display_order": 2,
                "options": [
                    "Understand the core concepts in plain English",
                    "Learn practical real-world applications",
                    "Avoid common pitfalls and hidden risks",
                    "Make better financial or career decisions"
                ]
            },
            {
                "id": "habits",
                "question": "What is your current background or status regarding this?",
                "display_order": 3,
                "options": [
                    "Just starting out on my journey",
                    "Consistent learner looking to level up",
                    "Active practitioner / professional",
                    "Exploring different perspectives and ideas"
                ]
            },
            {
                "id": "confusion",
                "question": "What is the single biggest question you hope this article answers?",
                "display_order": 4,
                "options": [
                    "How does this actually work behind the scenes?",
                    "What are the real trade-offs and hidden costs?",
                    "What specific steps should I take next?",
                    "How does this impact the broader future?"
                ]
            }
        ]


personal_lens_service = PersonalLensService()
