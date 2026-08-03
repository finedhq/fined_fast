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
    card_label: Optional[str] = None
    title: Optional[str] = None
    intro_text: str
    stages: list[ScenarioStage] = Field(min_length=2, max_length=6)
    reflection_question: Optional[str] = None
    reflection_label: Optional[str] = None
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
    card_label: Optional[str] = None
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
    comparison_rate: Optional[float] = None
    highlight_line: Optional[str] = None
    cta_text: str = "Continue"

class OutputCategory(BaseModel):
    id: str
    label: str
    color_hex: str

class ProfileRule(BaseModel):
    threshold_key: str
    min_value: int
    label: str
    color_hex: str
    note: str

class PillOption(BaseModel):
    label: str
    value: str
    impact: dict[str, int]

class PillGroup(BaseModel):
    group_id: str
    label: str
    options: list[PillOption]

class PillSelectorCardData(BaseModel):
    card_type: Literal["pill_selector"] = "pill_selector"
    card_label: Optional[str] = None
    title: str
    body_text: str
    output_categories: list[OutputCategory]
    profiles: list[ProfileRule] = Field(default_factory=list)
    base_allocation: dict[str, int]
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

class ChartDataset(BaseModel):
    label: str
    data: list[float]
    color: Optional[str] = None
    colors: Optional[list[str]] = None

class StatChip(BaseModel):
    value: str
    label: str
    color: str

class ChartQuote(BaseModel):
    text: str
    author: Optional[str] = None

class ChartCardData(BaseModel):
    card_type: Literal["chart"] = "chart"
    chart_style: Literal["line", "bar"] = "line"
    title: str
    quote: Optional[ChartQuote] = None
    body_text_top: str
    labels: list[str]
    datasets: list[ChartDataset] = Field(min_length=1, max_length=5)
    chart_caption: Optional[str] = None
    stat_chips: list[StatChip] = Field(default_factory=list)
    body_text_bottom: Optional[str] = None
    value_prefix: Optional[str] = None
    value_suffix: Optional[str] = None
    glossary_terms: list[ScenarioGlossaryTerm] = Field(default_factory=list)
    cta_text: str = "Continue"

class ConceptReason(BaseModel):
    icon: str
    title: str
    description: str

class GridCard(BaseModel):
    icon: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    desc: Optional[str] = None

class Callout(BaseModel):
    style: Optional[str] = "note"
    icon: Optional[str] = None
    text: str

class TimelineDay(BaseModel):
    color_theme: Optional[str] = "default"
    label: str
    title: str
    events: list[str] = Field(default_factory=list)

class BookPanel(BaseModel):
    title: str
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)
    footer: Optional[str] = None
    column_layout: Optional[str] = None

class BarItem(BaseModel):
    label: str
    percent_width: str
    color_var: Optional[str] = None
    color: Optional[str] = None
    value: str

class BarScenario(BaseModel):
    title: Optional[str] = None
    bars: list[BarItem] = Field(default_factory=list)
    summary: Optional[str] = None

class BarPanel(BaseModel):
    icon: Optional[str] = None
    title: str
    subtitle: Optional[str] = None
    bars: list[BarItem] = Field(default_factory=list)

class DataRow(BaseModel):
    label: str
    value: str
    is_highlight: bool = False

class DataRows(BaseModel):
    title: Optional[str] = None
    rows: list[DataRow] = Field(default_factory=list)

class ComparisonPanel(BaseModel):
    style: Optional[str] = "neutral"
    icon: Optional[str] = None
    title: str
    items: list[str] = Field(default_factory=list)

class TableData(BaseModel):
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)

class StatBox(BaseModel):
    value: str
    label: str
    color_var: Optional[str] = None

class ConceptCardData(BaseModel):
    card_type: Literal["concept"] = "concept"
    card_label: Optional[str] = None
    title: Optional[str] = None
    body_text_1: Optional[str] = None
    explanation: Optional[str] = None
    timeline: list[TimelineDay] = Field(default_factory=list)
    book_panels: list[BookPanel] = Field(default_factory=list)
    bar_scenario: Optional[BarScenario] = None
    data_rows: Optional[DataRows] = None
    grid_cards: list[GridCard] = Field(default_factory=list)
    reasons: list[ConceptReason] = Field(default_factory=list)
    comparison_panels: list[ComparisonPanel] = Field(default_factory=list)
    bar_panels: list[BarPanel] = Field(default_factory=list)
    body_text_2: Optional[str] = None
    table: Optional[TableData] = None
    simple_list: list[str] = Field(default_factory=list)
    stat_boxes: list[StatBox] = Field(default_factory=list)
    body_text_3: Optional[str] = None
    key_takeaway: Optional[str] = None
    callouts: list[Callout] = Field(default_factory=list)
    glossary_terms: list[ScenarioGlossaryTerm] = Field(default_factory=list)
    cta_text: str = "Continue"

class ExplorerItem(BaseModel):
    label: str
    title: str
    content: str
    icon: Optional[str] = None
    value: Optional[str] = None
    value_color: Optional[str] = None

class InteractiveCardData(BaseModel):
    card_type: Literal["interactive"] = "interactive"
    card_label: Optional[str] = None
    title: str
    intro_text: str
    variant: Literal["list", "grid"] = "list"
    items: list[ExplorerItem] = Field(min_length=2, max_length=6)
    button_text: str = "Continue"

class NextModuleTeaser(BaseModel):
    label: str = "Up next"
    title: str
    description: str

class CompletionCardData(BaseModel):
    card_type: Literal["completion"] = "completion"
    title: str
    subtitle: str
    badge_icon: str = "🔔"
    learnings: list[str] = Field(default_factory=list)
    total_finstars: Optional[int] = None
    next_module_teaser: Optional[NextModuleTeaser] = None
    cta_text: str = "Continue"

# Registry — used by the route/service to validate the right shape
# for whatever card_type the admin selects.
CARD_DATA_SCHEMAS = {
    "cinematic": CinematicCardData,
    "scenario": ScenarioCardData,
    "risk_spectrum": RiskSpectrumCardData,
    "slider_calculator": SliderCalculatorCardData,
    "pill_selector": PillSelectorCardData,
    "quiz": QuizCardData,
    "chart": ChartCardData,
    "concept": ConceptCardData,
    "interactive": InteractiveCardData,
    "completion": CompletionCardData,
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