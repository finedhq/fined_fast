# app/models/card_data.py
# One Pydantic model per card type. card_type is the discriminator.
# Add a new class here + one line in CARD_DATA_SCHEMAS for each new card type.

from pydantic import BaseModel, Field
from typing import Literal, Optional


class CinematicLine(BaseModel):
    text: str
    emphasis: Literal["", "em", "em2"] = ""

class ScenarioGlossaryTerm(BaseModel):
    term: str
    definition: str
    example: Optional[str] = None

class ScenarioStage(BaseModel):
    icon: str
    name: str
    detail: str
    glossary_terms: list[ScenarioGlossaryTerm] = Field(default_factory=list)
    stat_line: Optional[str] = None


class CinematicCardData(BaseModel):
    card_type: Literal["cinematic"] = "cinematic"
    lines: list[CinematicLine] = Field(min_length=2, max_length=5)
    tagline: str
    cta_text: str = "Continue"
    finstars: int = Field(ge=0, default=0)

class ScenarioCardData(BaseModel):
    card_type: Literal["scenario"] = "scenario"
    intro_text: str
    stages: list[ScenarioStage] = Field(min_length=2, max_length=6)
    reflection_question: str
    reflection_options: list[str] = Field(min_length=2, max_length=5)

class RiskSpectrumDot(BaseModel):
    id: str  # internal identifier
    label: str
    position_pct: int = Field(ge=0, le=100)
    color: Literal["blue", "green", "amber", "red"] = "blue"
    title: str
    desc: str
    return_text: str
    risk_text: str

class RiskSpectrumCardData(BaseModel):
    card_type: Literal["risk_spectrum"] = "risk_spectrum"
    title: str
    body_text: str
    dots: list[RiskSpectrumDot] = Field(min_length=2, max_length=7)
    highlight_line: Optional[str] = None
    cta_text: str = "Continue"

class SliderCalculatorCardData(BaseModel):
    card_type: Literal["slider_calculator"] = "slider_calculator"
    title: str
    body_text: str
    glossary_terms: list[ScenarioGlossaryTerm] = []
    default_monthly_investment: int = Field(ge=500, le=100000)
    default_investment_period: int = Field(ge=1, le=40)
    default_expected_return: float = Field(ge=1.0, le=30.0)
    highlight_line: Optional[str] = None
    cta_text: str = "Continue"

class AllocationImpact(BaseModel):
    eq: int = 0
    fd: int = 0
    gold: int = 0

class PillOption(BaseModel):
    label: str
    value: str
    impact: AllocationImpact

class PillGroup(BaseModel):
    group_id: str
    label: str
    options: list[PillOption]

class PillSelectorCardData(BaseModel):
    card_type: Literal["pill_selector"] = "pill_selector"
    title: str
    body_text: str
    base_allocation: AllocationImpact
    groups: list[PillGroup]
    cta_text: str = "Continue"

class QuizOption(BaseModel):
    id: str
    text: str
    is_correct: bool

class QuizCardData(BaseModel):
    card_type: Literal["quiz"] = "quiz"
    title: str
    question: str
    options: list[QuizOption] = Field(min_length=2, max_length=5)
    explanation: str
    cta_text: str = "Continue"

class ConceptReason(BaseModel):
    icon: str
    title: str
    description: str

class ConceptCardData(BaseModel):
    card_type: Literal["concept"] = "concept"
    title: str
    explanation: str
    reasons: list[ConceptReason] = Field(default_factory=list)
    key_takeaway: Optional[str] = None

class ExplorerItem(BaseModel):
    label: str
    title: str
    content: str
    icon: Optional[str] = None

class InteractiveCardData(BaseModel):
    card_type: Literal["interactive"] = "interactive"
    title: str
    intro_text: str
    items: list[ExplorerItem] = Field(min_length=2, max_length=6)


# Registry — used by the route/service to validate the right shape
# for whatever card_type the admin selects.
CARD_DATA_SCHEMAS = {
    "cinematic": CinematicCardData,
    "scenario": ScenarioCardData,
    "risk_spectrum": RiskSpectrumCardData,
    "slider_calculator": SliderCalculatorCardData,
    "pill_selector": PillSelectorCardData,
    "quiz": QuizCardData,
    "concept": ConceptCardData,
    "interactive": InteractiveCardData,
    # "completion": CompletionCardData,
}

def validate_card_data(card_type: str, raw_data: dict) -> dict:
    """
    Validates raw_data against the schema for card_type.
    Raises pydantic.ValidationError if the shape doesn't match.
    Returns the validated dict, ready to store in the card_data jsonb column.
    """
    schema = CARD_DATA_SCHEMAS.get(card_type)
    if not schema:
        raise ValueError(f"Unknown card_type: {card_type}")
    validated = schema(**raw_data)
    return validated.model_dump()