# app/models/card_data.py
# One Pydantic model per card type. card_type is the discriminator.
# Add a new class here + one line in CARD_DATA_SCHEMAS for each new card type.

import re
from pydantic import BaseModel, Field, model_validator
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
    card_label: Optional[str] = None
    title: Optional[str] = None
    lines: list[CinematicLine] = Field(min_length=2, max_length=5)
    tagline: str
    cta_text: str = "Continue"
    finstars: int = Field(ge=0, default=0)          # module-start teaser (cosmetic)
    allotted_finstars: int = Field(ge=0, default=0)  # actual stars awarded on completion

class ScenarioCardData(BaseModel):
    card_type: Literal["scenario"] = "scenario"
    card_label: Optional[str] = None
    title: Optional[str] = None
    intro_text: str
    stages: list[ScenarioStage] = Field(min_length=2, max_length=6)
    reflection_question: Optional[str] = None
    reflection_label: Optional[str] = None
    reflection_options: list[str] = Field(min_length=2, max_length=5, default_factory=list)
    callouts: list["Callout"] = Field(default_factory=list)
    allotted_finstars: int = Field(ge=0, default=0)

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
    allotted_finstars: int = Field(ge=0, default=0)

class SliderCalculatorCardData(BaseModel):
    card_type: Literal["slider_calculator"] = "slider_calculator"
    card_label: Optional[str] = None
    title: str
    body_text: str
    glossary_terms: list[ScenarioGlossaryTerm] = []
    default_monthly_investment: int = Field(ge=500, le=100000)
    default_investment_period: int = Field(ge=1, le=40)
    default_expected_return: float = Field(ge=1.0, le=30.0)
    comparison_rate: Optional[float] = None
    highlight_line: Optional[str] = None
    cta_text: str = "Continue"
    allotted_finstars: int = Field(ge=0, default=0)

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
    allotted_finstars: int = Field(ge=0, default=0)

class QuizOption(BaseModel):
    id: str
    text: str
    is_correct: bool

class QuizCardData(BaseModel):
    card_type: Literal["quiz"] = "quiz"
    card_label: Optional[str] = None
    title: str
    question: str
    options: list[QuizOption] = Field(min_length=2, max_length=5)
    explanation: str
    cta_text: str = "Continue"
    allotted_finstars: int = Field(ge=0, default=0)

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
    card_label: Optional[str] = None
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
    allotted_finstars: int = Field(ge=0, default=0)

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
    allotted_finstars: int = Field(ge=0, default=0)

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
    allotted_finstars: int = Field(ge=0, default=0)

class NextModuleTeaser(BaseModel):
    label: str = "Up next"
    title: str
    description: str

class CompletionCardData(BaseModel):
    card_type: Literal["completion"] = "completion"
    card_label: Optional[str] = None
    title: str
    subtitle: str
    badge_icon: str = "🔔"
    learnings: list[str] = Field(default_factory=list)
    total_finstars: Optional[int] = None
    next_module_teaser: Optional[NextModuleTeaser] = None
    # Optional line replaying the learner's warm-up poll answer; "{choice}" is
    # replaced with the option they picked. Omitted when they skipped the poll.
    poll_replay: Optional[str] = None
    # Optional full replacement line for specific poll option ids, e.g.
    # {"dont_know": "At the start you weren't sure. The fuller answer: …"}
    poll_replay_by_choice: dict[str, str] = Field(default_factory=dict)
    cta_text: str = "Continue"


# ── Scrollytelling card types (course v2 onward) ─────────────────────────────
# Body text in these cards supports **bold** and [[glossary term]] only; the
# frontend escapes everything else, so HTML typed into a field shows as text.

# Adding a new figure/tool = one frontend component + one name here.
FigureKind = Literal[
    "shrinking_basket_predict", "two_ledgers_payoff_drag", "two_rooms_money_flow",   # Module 1
    "ownership_grid_one_share", "bars_price_vs_size", "ownership_grid_rights_queue",  # Module 2
]
ModelKind = Literal["leak_lab", "slice_calculator"]

# Each bespoke figure is built for a fixed number of steps; it reacts to the
# step's position (1st, 2nd, …), so the count must match.
FIGURE_STEP_COUNTS = {
    "shrinking_basket_predict": 4,
    "two_ledgers_payoff_drag": 4,
    "two_rooms_money_flow": 4,
    "ownership_grid_one_share": 4,
    "bars_price_vs_size": 4,
    "ownership_grid_rights_queue": 4,
}

_GLOSSARY_MARK = re.compile(r"\[\[([^\[\]]+)\]\]")


def _require_unique(ids: list[str], what: str) -> None:
    seen = set()
    for i in ids:
        if i in seen:
            raise ValueError(f"duplicate {what} id '{i}'")
        seen.add(i)


class NarrativeAnnotation(BaseModel):
    accent_type: Literal["info", "warning", "highlight"] = "info"
    text: str

class TapGuessOption(BaseModel):
    id: str
    label: str
    feedback: str
    correct: bool = False

class TapGuess(BaseModel):
    kind: Literal["tap_guess"] = "tap_guess"
    prompt: str
    options: list[TapGuessOption] = Field(min_length=2, max_length=5)

    @model_validator(mode="after")
    def _check_options(self):
        _require_unique([o.id for o in self.options], "option")
        if sum(o.correct for o in self.options) != 1:
            raise ValueError("a tap-guess needs exactly one correct option")
        return self

class NarrativeFigure(BaseModel):
    kind: FigureKind
    title: str

class NarrativeStep(BaseModel):
    step_id: str
    badge_label: str
    heading: str
    body: str
    stat: Optional[str] = None
    annotation: Optional[NarrativeAnnotation] = None
    glossary_terms: list[ScenarioGlossaryTerm] = Field(default_factory=list)
    interaction: Optional[TapGuess] = None

    @model_validator(mode="after")
    def _check_glossary_marks(self):
        defined = {g.term.strip().lower() for g in self.glossary_terms}
        for marked in _GLOSSARY_MARK.findall(self.body):
            if marked.strip().lower() not in defined:
                raise ValueError(
                    f"step '{self.step_id}': [[{marked}]] has no matching glossary term in this step"
                )
        return self

class NarrativeCardData(BaseModel):
    card_type: Literal["narrative"] = "narrative"
    card_label: Optional[str] = None
    title: str
    chapter_label: Optional[str] = None
    figure: NarrativeFigure
    steps: list[NarrativeStep] = Field(min_length=2, max_length=7)
    cta_text: str = "Continue"
    allotted_finstars: int = Field(ge=0, default=0)

    @model_validator(mode="after")
    def _check_steps(self):
        _require_unique([s.step_id for s in self.steps], "step")
        needed = FIGURE_STEP_COUNTS.get(self.figure.kind)
        if needed and len(self.steps) != needed:
            raise ValueError(
                f"the '{self.figure.kind}' figure is built for exactly {needed} steps (this card has {len(self.steps)})"
            )
        return self


class RangeControl(BaseModel):
    min: float
    max: float
    step: float = Field(gt=0, default=1)
    default: float

    @model_validator(mode="after")
    def _check_range(self):
        if not (self.min <= self.default <= self.max):
            raise ValueError("default must be between min and max")
        return self

class WhereOption(BaseModel):
    id: str
    label: str
    rate: float = Field(ge=0, le=30)  # % a year

class WhereControl(BaseModel):
    options: list[WhereOption] = Field(min_length=2, max_length=5)
    default: str

    @model_validator(mode="after")
    def _check_default(self):
        ids = [o.id for o in self.options]
        _require_unique(ids, "option")
        if self.default not in ids:
            raise ValueError(f"default '{self.default}' is not one of the options")
        return self

class LeakLabControls(BaseModel):
    amount: RangeControl
    years: RangeControl
    inflation: RangeControl
    where: WhereControl

class LeakLabAsideWhen(BaseModel):
    where: str
    years: float
    inflation: float

class LeakLabConfig(BaseModel):
    controls: LeakLabControls
    min_controls_to_complete: int = Field(ge=1, le=4, default=2)
    neutrality_note: Optional[str] = None
    aside_text: Optional[str] = None
    aside_when: Optional[LeakLabAsideWhen] = None

# ── "Your Slice" (slice_calculator): money in -> whole shares, % of the
# company, and what the slice is worth if the business does better or worse.
class SliceRangeControl(RangeControl):
    label: Optional[str] = None

class SliceCompany(BaseModel):
    id: str
    label: str
    price: float = Field(gt=0)             # ₹ per share (made-up companies)
    total_shares: int = Field(gt=0)

class SliceCompanyControl(BaseModel):
    label: Optional[str] = None
    options: list[SliceCompany] = Field(min_length=2, max_length=5)
    default: str

    @model_validator(mode="after")
    def _check_default(self):
        ids = [o.id for o in self.options]
        _require_unique(ids, "company")
        if self.default not in ids:
            raise ValueError(f"default '{self.default}' is not one of the companies")
        return self

class SliceCalculatorControls(BaseModel):
    amount: SliceRangeControl
    company: SliceCompanyControl
    business_change: SliceRangeControl     # % change in the business, a what-if dial

class SliceAsideWhen(BaseModel):
    amount_below: float

class SliceCalculatorConfig(BaseModel):
    controls: SliceCalculatorControls
    min_controls_to_complete: int = Field(ge=1, le=3, default=2)
    neutrality_note: Optional[str] = None
    aside_text: Optional[str] = None       # may use {ownership_pct}
    aside_when: Optional[SliceAsideWhen] = None
    footnote: Optional[str] = None

# Which settings shape each tool takes.
MODEL_CONFIGS = {"leak_lab": LeakLabConfig, "slice_calculator": SliceCalculatorConfig}

class ModelCardData(BaseModel):
    card_type: Literal["model"] = "model"
    card_label: Optional[str] = None
    title: str
    concept: Optional[str] = None
    model_kind: ModelKind
    config: LeakLabConfig | SliceCalculatorConfig
    as_of: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")  # month the rates were checked, e.g. "2026-09"
    rate_source: Optional[str] = None
    reward_rule: Optional[str] = None  # e.g. "Move at least two controls." (shown next to the stars)
    cta_text: str = "Continue"
    allotted_finstars: int = Field(ge=0, default=0)

    @model_validator(mode="before")
    @classmethod
    def _config_for_kind(cls, data):
        # Validate `config` against the chosen tool's shape (not "whichever fits").
        if isinstance(data, dict) and isinstance(data.get("config"), dict):
            shape = MODEL_CONFIGS.get(data.get("model_kind"))
            if shape:
                data = {**data, "config": shape(**data["config"])}
        return data


class WarmupPollOption(BaseModel):
    id: str
    label: str

class WarmupPoll(BaseModel):
    id: str
    prompt: str
    options: list[WarmupPollOption] = Field(min_length=2, max_length=5)
    ack: str = "Noted. We'll come back to this at the end."

    @model_validator(mode="after")
    def _check_options(self):
        _require_unique([o.id for o in self.options], "option")
        return self

class WarmupChipOption(BaseModel):
    id: str
    label: str
    value: Optional[int] = Field(default=None, ge=0)  # null = "skip"

class WarmupChip(BaseModel):
    id: str
    prompt: str
    options: list[WarmupChipOption] = Field(min_length=2, max_length=6)
    ack: str = "Got it. The Leak Lab will start from this amount."
    skip_ack: str = "No problem. We'll use ₹1 lakh as the example."

    @model_validator(mode="after")
    def _check_options(self):
        _require_unique([o.id for o in self.options], "option")
        return self

class HeroCardData(BaseModel):
    """The top of a module page, exactly as in the prototype: badge, headline,
    subhead, read time + info chips, and the warm-up (poll + optional chip)."""
    card_type: Literal["hero"] = "hero"
    badge: str                                     # "Module 1 · Basics of the Stock Market"
    short_title: Optional[str] = None              # top bar; defaults to the module title
    headline: str
    subhead: str
    read_time: Optional[str] = None                # "4 min" -> shown as "4 min read"
    meta_chips: list[str] = Field(default_factory=list, max_length=5)
    warmup_label: str = "Before you start"
    poll: WarmupPoll
    chip: Optional[WarmupChip] = None
    note: Optional[str] = "No right answers here. Tap whatever feels true."
    scroll_cta: str = "Scroll to begin"
    allotted_finstars: int = Field(ge=0, default=0)

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
    "narrative": NarrativeCardData,
    "model": ModelCardData,
    "hero": HeroCardData,
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