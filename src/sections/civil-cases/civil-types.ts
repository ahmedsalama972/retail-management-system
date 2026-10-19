export type CivilHearingPayload = {
  hearing_date: string;
  decision: string;
  notes: string;
};

export type CivilPartyType = { id: string; name: string };

export const PARTY_TYPES: CivilPartyType[] = [
  { id: 'company', name: 'الشركة' },
  { id: 'client', name: 'العميل' },
];

export const emptyHearing = (): CivilHearingPayload => ({
  hearing_date: '',
  decision: '',
  notes: '',
});

export type CivilCasePayload = {
  party_type: CivilPartyType;
  company_name: string;
  client_id: string;
  party: any;
  filing_date: string;
  court_name: string;
  case_number: string;
  case_year: string;
  circuit: string;
  judgment: any;
  notes: string;
  hearings: CivilHearingPayload[];
  // appeal
  appeal_party_type: CivilPartyType;
  appeal_company_name: string;
  appeal_client_id: string;
  appeal_party: any;
  appeal_date: string;
  appeal_court_name: string;
  appeal_number: string;
  appeal_year: string;
  appeal_circuit: string;
  appeal_judgment: any;
  appeal_notes: string;
  appeal_hearings: CivilHearingPayload[];
  document: File | null;
};

export const emptyCivilPayload = (): CivilCasePayload => ({
  party_type: PARTY_TYPES[0],
  company_name: '',
  client_id: '',
  party: null,
  filing_date: '',
  court_name: '',
  case_number: '',
  case_year: '',
  circuit: '',
  judgment: null,
  notes: '',
  hearings: [],
  appeal_party_type: PARTY_TYPES[0],
  appeal_company_name: '',
  appeal_client_id: '',
  appeal_party: null,
  appeal_date: '',
  appeal_court_name: '',
  appeal_number: '',
  appeal_year: '',
  appeal_circuit: '',
  appeal_judgment: null,
  appeal_notes: '',
  appeal_hearings: [],
  document: null,
});
