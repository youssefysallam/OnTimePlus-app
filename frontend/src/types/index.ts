export type MessageRole = 'user' | 'bot' | 'system';
export type DayOfWeek = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
export type TransitLine =
  | 'RED'
  | 'ORANGE'
  | 'BLUE'
  | 'GREEN_B'
  | 'GREEN_C'
  | 'GREEN_D'
  | 'GREEN_E'
  | 'SILVER'
  | 'COMMUTER_RAIL'
  | 'FERRY';
export type TransitMode = 'SUBWAY' | 'BUS' | 'SHUTTLE' | 'WALK' | 'FERRY' | 'COMMUTER_RAIL';
export type Severity = 'ON_TIME' | 'MODERATE' | 'SEVERE' | 'SUSPENDED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// ─── App-internal types ────────────────────────────────────────────────────

export type RetrievedChunk = {
  id: string;
  source: string;
  text: string;
  score?: number;
};

export type ClassEvent = {
  id: string;
  name: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  location: string;
  locationCoords?: {
    latitude: number;
    longitude: number;
  };
};

export type Alert = {
  id: string;
  line?: TransitLine;
  mode?: TransitMode;
  severity: Severity;
  title: string;
  description: string;
  affectedSegment?: string;
  reportedAt: number;
  source: 'MBTA' | 'UMB_SHUTTLE' | 'MOCK';
};

export type TripLeg = {
  id: string;
  mode: TransitMode;
  line?: TransitLine;
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  durationMin: number;
};

export type TripEstimate = {
  id: string;
  leaveBy: string;
  arriveBy: string;
  bufferMin: number;
  risk: RiskLevel;
  legs: TripLeg[];
  affectingAlerts: Alert[];
};

export type SpecialCardData =
  | { type: 'ALERT'; alert: Alert }
  | { type: 'TRIP'; estimate: TripEstimate; classEvent?: ClassEvent }
  | { type: 'BRIEFING'; estimate: TripEstimate; classEvent?: ClassEvent; summary: string }
  | { type: 'SCHEDULE_CONFIRM'; classEvent: ClassEvent };

export type Message = {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  cards?: SpecialCardData[];
  chips?: string[];
  retrieved?: RetrievedChunk[];
};

export type Conversation = {
  id: string;
  sessionId: string;
  startedAt: number;
  messages: Message[];
};

// ─── Backend API contract ──────────────────────────────────────────────────
// Matches the Pydantic schemas in the embeddings branch (schemas.py)

export type BackendRiskLabel = 'reliable' | 'caution' | 'risky' | 'unknown';

export type BackendRiskAnalysis = {
  label: BackendRiskLabel;
  buffer_min: number;
  sigma_used: number;
  explanation: string;
  triggered_alerts: string[];
};

export type BackendRouteSegment = {
  mode: string;
  from_stop: string;
  to_stop: string;
  expected_min: number;
  std_min: number;
  alert_added_min: number;
  citations: string[];
};

export type BackendRoutePlan = {
  segments: BackendRouteSegment[];
  total_expected_min: number;
  total_std_min: number;
  total_alert_added_min: number;
};

export type BackendAnswer = {
  recommendation: string;
  risk: BackendRiskAnalysis;
  plan: BackendRoutePlan | null;
  suggested_depart_time: string | null;
  citations: string[];
  raw_response: string;
  generated_at: string;
};

export type BackendKBDoc = {
  id: string;
  type: string;
  route: string;
  title: string;
  content: string;
  source: string;
};

export type BackendRetrievedDoc = {
  doc: BackendKBDoc;
  score: number;
  retriever: string;
};

export type BackendIntent = {
  origin: string | null;
  destination: string | null;
  deadline: string | null;
  depart_time: string | null;
  high_stakes: boolean;
  user_constraints: string[];
  raw_query: string;
};

// POST /chat response — matches backend ChatResponse in schemas.py
export type ChatResponse = {
  answer: BackendAnswer;
  intent: BackendIntent;
  retrieved: BackendRetrievedDoc[];
};

// POST /chat request — matches backend ChatRequest in schemas.py
// schedule keys match what intent_extractor.py reads: "time" and "destination"
export type ApiChatSchedule = {
  event?: string;
  time: string;        // HH:MM, 24-hour — read as deadline by intent_extractor
  destination?: string;
  high_stakes?: boolean;
};

export type ApiChatRequest = {
  query: string;
  schedule?: ApiChatSchedule;
};
