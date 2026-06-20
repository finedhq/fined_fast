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


# Registry — used by the route/service to validate the right shape
# for whatever card_type the admin selects.
CARD_DATA_SCHEMAS = {
    "cinematic": CinematicCardData,
    "scenario": ScenarioCardData,
    # "quiz": QuizCardData,            # add as each type is built
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