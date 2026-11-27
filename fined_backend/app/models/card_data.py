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

class QuizItem(BaseModel):
    id: str
    label: str
    zone: Optional[str] = None                     # format "sort": the zone it belongs in

class QuizZone(BaseModel):
    id: str
    label: str

class QuizCardData(BaseModel):
    """A quiz card. `format` (Module 12 on) picks how it is answered; every
    format saves ONE answer string and is right only if it equals
    quiz_answer_key() exactly (all or nothing):
      choice      the option id                       ("c")
      multi       the chosen option ids, sorted        ("a,c,e")
      order       the item ids in the reader's order   ("costs,staff,govt,owners")
      sort        item=zone for each item, items order ("bank=z_money;…")
      order_book  the locked-in limit price            ("101")
    """
    card_type: Literal["quiz"] = "quiz"
    format: Literal["choice", "multi", "order", "sort", "order_book"] = "choice"
    card_label: Optional[str] = None
    badge_label: Optional[str] = None              # "Question 7 of 20" (default "Quick check")
    title: str
    question: str
    instruction: Optional[str] = None              # "Select all that apply"
    options: list[QuizOption] = Field(default_factory=list, max_length=5)
    items: list[QuizItem] = Field(default_factory=list, max_length=6)
    zones: list[QuizZone] = Field(default_factory=list, max_length=6)
    correct_order: list[str] = Field(default_factory=list)
    book: Optional[dict] = None                    # format "order_book" (see check below)
    control: Optional[dict] = None
    correct: Optional[int | float] = None           # format "order_book": the right limit price
    explanation: str
    cta_text: str = "Continue"
    allotted_finstars: int = Field(ge=0, default=0)

    @model_validator(mode="after")
    def _check_format(self):
        f = self.format
        n_right = sum(o.is_correct for o in self.options)
        if f in ("choice", "multi"):
            if len(self.options) < 2:
                raise ValueError(f"a '{f}' quiz needs 2–5 options")
            if len({o.id for o in self.options}) != len(self.options):
                raise ValueError("option ids must be unique")
        if f == "multi" and not (n_right >= 2 and n_right < len(self.options)):
            raise ValueError("a 'multi' quiz needs at least 2 right options and at least 1 wrong one")
        if f in ("order", "sort"):
            ids = [i.id for i in self.items]
            if len(ids) < 2 or len(set(ids)) != len(ids):
                raise ValueError(f"a '{f}' quiz needs 2–6 items with unique ids")
        if f == "order" and sorted(self.correct_order) != sorted(i.id for i in self.items):
            raise ValueError("correct_order must list every item id exactly once")
        if f == "sort":
            zone_ids = {z.id for z in self.zones}
            if len(zone_ids) < 2 or any(i.zone not in zone_ids for i in self.items):
                raise ValueError("every 'sort' item needs a zone from zones (at least 2 zones)")
        if f == "order_book":
            book, control = self.book or {}, self.control or {}
            asks = [lv["price"] for lv in book.get("levels", []) if lv.get("ask_qty")]
            bids = [lv["price"] for lv in book.get("levels", []) if lv.get("bid_qty")]
            if not asks or not bids or (book.get("order_ticket") or {}).get("side") != "buy":
                raise ValueError("an 'order_book' quiz needs asks, bids and a buy ticket")
            if not all(k in control for k in ("min", "max", "step", "default")):
                raise ValueError("an 'order_book' quiz control needs min, max, step and default")
            # The stored answer must be the book's cheapest ask: the lowest buy limit that fills now.
            if self.correct != min(asks) or not (control["min"] <= self.correct <= control["max"]):
                raise ValueError(f"'correct' must be the cheapest ask (₹{min(asks)}) and inside the control's range")
        return self


def _num(v) -> str:
    """101.0 -> '101' (answers are saved as text)."""
    return str(int(v)) if float(v).is_integer() else str(v)

def quiz_answer_key(cd: dict) -> Optional[str]:
    """The answer string a quiz card counts as right (see QuizCardData), or None."""
    f = cd.get("format") or "choice"
    if f == "choice":
        return next((o["id"] for o in cd.get("options", []) if o.get("is_correct")), None)
    if f == "multi":
        return ",".join(sorted(o["id"] for o in cd.get("options", []) if o.get("is_correct"))) or None
    if f == "order":
        return ",".join(cd.get("correct_order") or []) or None
    if f == "sort":
        return ";".join(f"{i['id']}={i.get('zone')}" for i in cd.get("items", [])) or None
    if f == "order_book":
        return _num(cd["correct"]) if cd.get("correct") is not None else None
    return None

def quiz_is_right(cd: dict, answer) -> bool:
    key = quiz_answer_key(cd)
    return key is not None and (answer or "").strip() == key

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

# WinterArc Days 5–7: the day's collectible "Arc card" on the completion
# screen, filled from the reader's own games on the page (frontend arc.js).
class ArcCard(BaseModel):
    kind: Literal["wa5", "wa6", "wa7"]
    label: str = Field(max_length=40)

class CompletionCardData(BaseModel):
    card_type: Literal["completion"] = "completion"
    card_label: Optional[str] = None
    title: str
    subtitle: str
    badge_icon: str = "🔔"
    learnings: list[str] = Field(default_factory=list)
    learnings_title: Optional[str] = None          # default "What this module covered" (Module 12: review pointers)
    # A test module (Module 12): the course certificate needs at least this many
    # of the module's quiz questions right; below it the learner can retake.
    pass_mark: Optional[int] = Field(default=None, ge=1)
    total_finstars: Optional[int] = None
    next_module_teaser: Optional[NextModuleTeaser] = None
    # Optional line replaying the learner's warm-up poll answer; "{choice}" is
    # replaced with the option they picked. Omitted when they skipped the poll.
    poll_replay: Optional[str] = None
    # Optional full replacement line for specific poll option ids, e.g.
    # {"dont_know": "At the start you weren't sure. The fuller answer: …"}
    poll_replay_by_choice: dict[str, str] = Field(default_factory=dict)
    # WinterArc only: one small real-life money action for the day, shown with
    # an "I did this" tick-box at the end of the day page. Earns no points.
    winterarc_action: Optional[str] = Field(default=None, max_length=200)
    # Optional line using the amount picked in the hero's warm-up chip:
    # "{amount}" is that amount, "{20%}" (any whole number) is that share of
    # it. Omitted when the reader skipped the chip. Stays on the page.
    chip_replay: Optional[str] = Field(default=None, max_length=300)
    arc: Optional[ArcCard] = None
    cta_text: str = "Continue"

    @model_validator(mode="after")
    def _check_chip_replay(self):
        if self.chip_replay:
            for token in re.findall(r"\{([^{}]*)\}", self.chip_replay):
                if token != "amount" and not re.fullmatch(r"\d{1,3}%", token):
                    raise ValueError(f"chip_replay: unknown placeholder {{{token}}} (use {{amount}} or e.g. {{20%}})")
        return self


# ── Scrollytelling card types (course v2 onward) ─────────────────────────────
# Body text in these cards supports **bold** and [[glossary term]] only; the
# frontend escapes everything else, so HTML typed into a field shows as text.

# Adding a new figure/tool = one frontend component + one name here.
FigureKind = Literal[
    "shrinking_basket_predict", "two_ledgers_payoff_drag", "two_rooms_money_flow",   # Module 1
    "ownership_grid_one_share", "bars_price_vs_size", "ownership_grid_rights_queue",  # Module 2
    "bars_who_trades", "rulebook_switch", "vault_preview",                             # Module 3
    "trade_map_accounts", "trade_map_brokers", "trade_map_settlement",                 # Module 4
    "trade_map_going_public", "trade_map_ipo_steps", "ownership_grid_two_ways",        # Module 5
    "order_book_two_prices", "order_book_moves", "bars_hoped_vs_actual",              # Module 6
    "order_book_your_order", "order_book_two_ways", "order_book_what_next",  # Module 7
    "bars_market_scoreboard", "ownership_grid_profit_shared", "line_chart_tiffin_year",  # Module 8
    "trade_map_rbi_ripple", "trade_map_budget", "trade_map_world",  # Module 9
    "line_chart_nifty_ride", "line_chart_end_of_2007", "trade_map_money_homes",  # Module 10
    "bars_two_questions", "bars_fair_yardstick", "trade_map_course_parts",  # Module 11
    "stack_bars_arjun_month", "line_chart_save_first", "stack_bars_needs_wants",  # WinterArc Day 1
    "trade_map_wa2_bank", "accounts_wa2",  # WinterArc Day 2
    "thali_wa3", "growth_lanes_wa3",  # WinterArc Day 3
    "emi_calendar_wa4", "card_statement_wa4", "trade_map_wa4_credit_record",  # WinterArc Day 4
    "pool_wa5", "claim_wa5", "shield_wa5",  # WinterArc Day 5
    "shock_deck_wa6", "fund_sizer_wa6", "goal_forge_wa6",  # WinterArc Day 6
    "city_wa7", "routes_wa7", "complaints_wa7",  # WinterArc Day 7
]
ModelKind = Literal["leak_lab", "slice_calculator", "money_sorter", "allocation_builder", "month_happens", "run_the_bank", "compound_race", "card_months"]

# Each figure reacts to the step's position (1st, 2nd, …), so a chapter must
# have exactly as many steps as its figure has states. The trade maps take
# theirs from their frontend config (scrolly/figures/module4Figures.js and
# module5Figures.js, as does Module 5's owner-groups grid, and Module 6's
# order books in module6Figures.js); keep
# these numbers equal to the length of each config's step list.
FIGURE_STEP_COUNTS = {
    "shrinking_basket_predict": 4,
    "two_ledgers_payoff_drag": 4,
    "two_rooms_money_flow": 4,
    "ownership_grid_one_share": 4,
    "bars_price_vs_size": 4,
    "ownership_grid_rights_queue": 4,
    "bars_who_trades": 4,
    "rulebook_switch": 3,
    "vault_preview": 4,
    "trade_map_accounts": 4,
    "trade_map_brokers": 4,
    "trade_map_settlement": 4,
    "trade_map_going_public": 4,
    "trade_map_ipo_steps": 4,
    "ownership_grid_two_ways": 4,
    "order_book_two_prices": 4,
    "order_book_moves": 4,
    "bars_hoped_vs_actual": 4,
    "order_book_your_order": 3,
    "order_book_two_ways": 4,
    "order_book_what_next": 3,
    "bars_market_scoreboard": 4,
    "ownership_grid_profit_shared": 4,
    "line_chart_tiffin_year": 3,
    "trade_map_rbi_ripple": 4,
    "trade_map_budget": 3,
    "trade_map_world": 3,
    "line_chart_nifty_ride": 4,
    "line_chart_end_of_2007": 3,
    "trade_map_money_homes": 4,
    "bars_two_questions": 4,
    "bars_fair_yardstick": 4,
    "trade_map_course_parts": 4,
    "stack_bars_arjun_month": 4,
    "line_chart_save_first": 4,
    "stack_bars_needs_wants": 4,
    "trade_map_wa2_bank": 4,
    "accounts_wa2": 4,
    "thali_wa3": 4,
    "growth_lanes_wa3": 4,
    "emi_calendar_wa4": 3,
    "card_statement_wa4": 4,
    "pool_wa5": 5,
    "claim_wa5": 7,
    "shield_wa5": 5,
    "shock_deck_wa6": 6,
    "fund_sizer_wa6": 3,
    "goal_forge_wa6": 5,
    "city_wa7": 5,
    "routes_wa7": 4,
    "complaints_wa7": 6,
    "trade_map_wa4_credit_record": 4,
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

# ── "Where Should This Money Live?" (money_sorter, Module 10): goal cards
# placed into places; every card × place pair has its own trade-off note
# (never "right" or "wrong"). Finished once enough cards are placed.
class SorterItem(BaseModel):
    id: str
    label: str

class MoneySorterConfig(BaseModel):
    cards: list[SorterItem] = Field(min_length=2, max_length=6)
    zones: list[SorterItem] = Field(min_length=2, max_length=5)
    notes: dict[str, dict[str, str]]
    min_controls_to_complete: int = Field(ge=1, le=6, default=4)
    neutrality_note: Optional[str] = None
    summary: Optional[str] = None
    guardrail: Optional[str] = None  # authoring note, not shown

    @model_validator(mode="after")
    def _check_notes(self):
        cards = [c.id for c in self.cards]
        zones = [z.id for z in self.zones]
        _require_unique(cards, "card")
        _require_unique(zones, "zone")
        for c in cards:
            for z in zones:
                if not (self.notes.get(c) or {}).get(z):
                    raise ValueError(f"no note for card '{c}' in zone '{z}'")
        if self.min_controls_to_complete > len(cards):
            raise ValueError("min_controls_to_complete is more than the number of cards")
        return self

# ── "Try a Mix" (allocation_builder, Module 11): a share of ₹1 lakh in shares
# and the biggest fall the reader could sit through; one year each of three
# kinds, no rebalancing. The steady part is made up; the share years are real.
class AllocationRangeControl(RangeControl):
    label: Optional[str] = None
    unit: Optional[str] = None

class AllocationControls(BaseModel):
    shares: AllocationRangeControl   # % of the money in shares
    limit: AllocationRangeControl    # biggest fall, %

class AllocationModel(BaseModel):
    steady_return_pct: float = Field(ge=0, le=30)
    share_returns_pct: dict[str, float]  # bad_year / typical_year / good_year
    single_year: bool = True
    no_rebalancing: bool = True

    @model_validator(mode="after")
    def _check_years(self):
        if set(self.share_returns_pct) != {"bad_year", "typical_year", "good_year"}:
            raise ValueError("share_returns_pct needs bad_year, typical_year and good_year")
        return self

class AllocationVerdict(BaseModel):
    within: str
    beyond: str

class AllocationBuilderConfig(BaseModel):
    controls: AllocationControls
    model: AllocationModel
    base_amount: float = Field(gt=0, default=100000)
    outputs: list[str] = []
    labels: dict[str, str] = {}
    verdict: AllocationVerdict
    footnote: Optional[str] = None  # may use {steady_return_pct}
    min_controls_to_complete: int = Field(ge=1, le=2, default=2)

# ── "The Month Happens" (month_happens, WinterArc Day 1): a month's budget as
# pots; unplanned events arrive one at a time and the reader picks where the
# money comes from. A `forced` event (a need that just costs more) takes its
# amount from the pots in `order`. Never scored; no choice is "right".
class MonthPot(BaseModel):
    id: str
    label: str
    amount: int = Field(ge=0)
    note: Optional[str] = None

class MonthChoice(BaseModel):
    id: str
    label: str
    take: dict[str, int] = Field(default_factory=dict)  # pot id -> rupees
    outcome: Optional[str] = None  # an end-of-month line when this was picked

class MonthForced(BaseModel):
    amount: int = Field(gt=0)
    order: list[str] = Field(min_length=1)
    text: str
    button: str

class MonthEvent(BaseModel):
    id: str
    sender: str
    when: str
    text: str
    short: str  # "the wedding" — used in the end-of-month lines
    choices: list[MonthChoice] = Field(default_factory=list, max_length=4)
    forced: Optional[MonthForced] = None

    @model_validator(mode="after")
    def _check_shape(self):
        if bool(self.forced) == bool(self.choices):
            raise ValueError(f"event '{self.id}' needs either choices or `forced`, not both")
        if self.choices:
            _require_unique([c.id for c in self.choices], "choice")
        return self

class MonthEndings(BaseModel):
    kept_all: str
    kept_some: str
    kept_none: str
    from_wants: Optional[str] = None

class MonthHappensConfig(BaseModel):
    pots: list[MonthPot] = Field(min_length=2, max_length=4)
    savings_pot: str = "savings"
    wants_pot: str = "wants"
    start_label: str
    end_label: Optional[str] = None
    events: list[MonthEvent] = Field(min_length=2, max_length=6)
    endings: MonthEndings
    compare: Optional[str] = None
    closing: Optional[str] = None
    neutrality_note: Optional[str] = None

    @model_validator(mode="after")
    def _check_pots(self):
        pots = [p.id for p in self.pots]
        _require_unique(pots, "pot")
        _require_unique([e.id for e in self.events], "event")
        for name in (self.savings_pot, self.wants_pot):
            if name not in pots:
                raise ValueError(f"no pot '{name}'")
        for i, e in enumerate(self.events):
            # After the first event the pots may be low, so a choice event
            # needs one free option to stay answerable.
            if i and e.choices and not any(all(v == 0 for v in c.take.values()) for c in e.choices):
                raise ValueError(f"event '{e.id}' needs one choice that costs nothing, so it can always be answered")
            used = [p for c in e.choices for p in c.take] + (e.forced.order if e.forced else [])
            for p in used:
                if p not in pots:
                    raise ValueError(f"event '{e.id}' uses unknown pot '{p}'")
        return self

# ── WinterArc Days 2–4 games. Never scored; every amount is made up. The
# frontend rules live in scrolly/tools/winterarcGames.js. Texts with {name}
# placeholders are filled in by the game.

# "Run the Bank" (run_the_bank, Day 2): choose how much of the deposits to
# lend, then withdrawals and a loan request arrive; what the vault can't
# cover is borrowed in a hurry at emergency_rate. Rates are % a year.
class BankEvent(BaseModel):
    id: str
    kind: Literal["withdraw", "loan"]
    sender: str
    who: str               # "Arjun", "shop owner" — used in the log and endings
    when: str
    text: str
    amount: int = Field(gt=0)
    yes: Optional[str] = None   # a loan's two buttons
    no: Optional[str] = None

    @model_validator(mode="after")
    def _check_loan(self):
        if self.kind == "loan" and not (self.yes and self.no):
            raise ValueError(f"loan event '{self.id}' needs `yes` and `no` button labels")
        return self

class BankEndings(BaseModel):
    profit: str
    loss: str
    cost_part: str
    vault: str
    waited: str
    paid_all: str

class RunTheBankConfig(BaseModel):
    deposits: int = Field(gt=0)
    saver_rate: float = Field(gt=0, le=30)
    loan_rate: float = Field(gt=0, le=40)
    emergency_rate: float = Field(gt=0, le=60)
    lend_options: list[int] = Field(min_length=2, max_length=6)
    end_label: str
    events: list[BankEvent] = Field(min_length=2, max_length=6)
    texts: dict[str, str] = {}
    endings: BankEndings
    closing: Optional[str] = None
    neutrality_note: Optional[str] = None

    @model_validator(mode="after")
    def _check(self):
        _require_unique([e.id for e in self.events], "event")
        if any(not 0 <= p <= 100 for p in self.lend_options):
            raise ValueError("lend_options are percentages from 0 to 100")
        if self.loan_rate <= self.saver_rate:
            raise ValueError("loan_rate must be above saver_rate, or the bank can never earn the gap")
        return self

# "Race to ₹10 lakh" (compound_race, Day 3): reach `goal` by end_age with the
# least of your own money; monthly payments at each month's end from a start
# age, for a number of years or until end_age, growing at rate (% a year,
# added monthly). The "today's prices" toggle uses inflation from now_age.
class RaceLength(BaseModel):
    id: str
    label: str
    years: Optional[int] = Field(default=None, ge=1)  # null = until end_age

class RacePick(BaseModel):
    start: int
    amount: int
    length: str

class RaceGhost(RacePick):
    label: str

class CompoundRaceConfig(BaseModel):
    goal: int = Field(gt=0)
    rate: float = Field(gt=0, le=30)
    end_age: int = Field(ge=30, le=80)
    now_age: int = Field(ge=15, le=60)
    inflation: float = Field(ge=0, le=20)
    starts: list[int] = Field(min_length=2, max_length=6)
    amounts: list[int] = Field(min_length=2, max_length=6)
    lengths: list[RaceLength] = Field(min_length=1, max_length=3)
    defaults: RacePick
    ghost: Optional[RaceGhost] = None
    texts: dict[str, str] = {}
    footnote: Optional[str] = None
    min_tries: int = Field(ge=1, le=5, default=2)

    @model_validator(mode="after")
    def _check(self):
        ids = [l.id for l in self.lengths]
        _require_unique(ids, "length")
        if any(not self.now_age <= a < self.end_age for a in self.starts):
            raise ValueError("every start age must be from now_age to before end_age")
        for name, pick in (("defaults", self.defaults), ("ghost", self.ghost)):
            if pick and (pick.start not in range(self.now_age, self.end_age) or pick.length not in ids or pick.amount <= 0):
                raise ValueError(f"{name}: start, amount or length is out of range")
        if self.defaults.start not in self.starts or self.defaults.amount not in self.amounts:
            raise ValueError("defaults must be one of the chips")
        return self

# "Six Statements" (card_months, Day 4): a card bill month by month. An
# optional swipe joins the bill, then the reader pays in full, part_amount,
# the minimum (min_pct of the bill, at least min_floor) or after the due date
# (the minimum plus late_fee, marked late). What isn't paid is charged
# monthly_rate (% a month). `only` limits a month's ways to pay.
class CardSpend(BaseModel):
    sender: str
    text: str
    amount: int = Field(gt=0)
    yes: str
    no: str

class CardMonth(BaseModel):
    id: str
    label: str
    spend: Optional[CardSpend] = None
    notice: Optional[str] = None
    only: Optional[list[Literal["full", "part", "min", "late"]]] = None

class CardEveryday(BaseModel):
    amount: int = Field(gt=0)  # joins every bill after the first
    label: str                 # may use {amount}

class CardEndings(BaseModel):
    lead_cost: str
    lead_free: str
    fees_part: str
    owed: str
    clear: str
    record_late: str
    record_min: str
    record_full: str

class CardMonthsConfig(BaseModel):
    start_balance: int = Field(gt=0)
    monthly_rate: float = Field(gt=0, le=10)
    min_pct: float = Field(gt=0, le=100)
    min_floor: int = Field(ge=0)
    late_fee: int = Field(ge=0)
    part_amount: int = Field(gt=0)
    everyday: Optional[CardEveryday] = None
    months: list[CardMonth] = Field(min_length=2, max_length=12)
    labels: dict[str, str]  # full / part / min / late / none, and log_<id>
    texts: dict[str, str] = {}
    endings: CardEndings
    closing: Optional[str] = None
    neutrality_note: Optional[str] = None

    @model_validator(mode="after")
    def _check(self):
        _require_unique([m.id for m in self.months], "month")
        missing = {"full", "part", "min", "late", "none"} - set(self.labels)
        if missing:
            raise ValueError(f"labels needs {sorted(missing)}")
        for m in self.months:
            if m.only is not None and not m.only:
                raise ValueError(f"month '{m.id}': `only` can't be empty")
        return self

# Which settings shape each tool takes.
MODEL_CONFIGS = {
    "leak_lab": LeakLabConfig,
    "slice_calculator": SliceCalculatorConfig,
    "money_sorter": MoneySorterConfig,
    "allocation_builder": AllocationBuilderConfig,
    "month_happens": MonthHappensConfig,
    "run_the_bank": RunTheBankConfig,
    "compound_race": CompoundRaceConfig,
    "card_months": CardMonthsConfig,
}

class ModelCardData(BaseModel):
    card_type: Literal["model"] = "model"
    card_label: Optional[str] = None
    title: str
    concept: Optional[str] = None
    model_kind: ModelKind
    config: LeakLabConfig | SliceCalculatorConfig | MoneySorterConfig | AllocationBuilderConfig | MonthHappensConfig | RunTheBankConfig | CompoundRaceConfig | CardMonthsConfig
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

# WinterArc Day 6: "your month" in the hero — money in and must-pay costs,
# used by the day's figures and kept in the browser only.
class MonthIncome(BaseModel):
    label: str
    options: list[int] = Field(min_length=2, max_length=6)
    default: int = Field(gt=0)
    step: int = Field(gt=0, default=1000)

class MonthMust(BaseModel):
    label: str
    presets: list[int] = Field(min_length=1, max_length=4)  # % of money in
    default_pct: int = Field(gt=0, le=100)
    step: int = Field(gt=0, default=500)

class HeroMonth(BaseModel):
    prompt: str
    income: MonthIncome
    must: MonthMust
    note: Optional[str] = None

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
    month: Optional[HeroMonth] = None
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