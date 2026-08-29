export type Habit = {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  archived?: boolean;
};

export type DiaryEntry = {
  date: string; // YYYY-MM-DD
  completions: Record<string, boolean>;
  todaysThoughts: string;
  accomplished: string;
  learned: string;
  improve: string;
  tomorrowMission: string;
  notes: string;
  updatedAt?: string;
};

export type Entries = Record<string, DiaryEntry>;

export type BucketStatus = "Dream" | "Planning" | "In Progress" | "Completed";

export type BucketItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number; // 0..100
  targetDate?: string;
  status: BucketStatus;
  notes: string;
  imageUrl?: string;
  createdAt: string;
};

export type ProjectStatus = "Not Started" | "In Progress" | "On Hold" | "Done";
export type WorkPriority = "Low" | "Medium" | "High" | "Critical";

export type Project = {
  id: string;
  name: string;
  description: string;
  priority: WorkPriority;
  progress: number; // 0..100
  status: ProjectStatus;
  deadline?: string;
  createdAt: string;
};

export type AccountType = "Cash" | "Bank" | "Savings" | "Trading" | "Other";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  amount: number;
};

export type AssetTxKind = "earning" | "spending";

export type AssetTx = {
  id: string;
  kind: AssetTxKind;
  amount: number;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
};

export type Balance = {
  /** Legacy account list — kept so older saved data still loads. */
  accounts: Account[];
  /** The manually-set starting balance. */
  baseAmount?: number;
  /** Earnings / spendings applied on top of the base amount. */
  transactions?: AssetTx[];
  lastUpdated?: string;
};

export type FocusItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Settings = {
  name: string;
  motivations: string[];
  paperSound: boolean;
  currencySymbol: string;
  hideBalance?: boolean;
};

export type OriginData = {
  settings: Settings;
  habits: Habit[];
  entries: Entries;
  bucket: BucketItem[];
  projects: Project[];
  balance: Balance;
  focus: FocusItem[];
};
