export interface HistoryMeta {
  readonly productType: string;
  readonly targets: string;
  readonly regulatoryDomain: string;
  readonly channels: string;
}

export interface HistItem {
  readonly id: string;
  readonly inputText: string;
  readonly imagePresent: boolean;
  readonly score: number;
  readonly verdict: 'Approved' | 'Rejected';
  readonly meta: HistoryMeta;
  readonly timestamp: string;
  readonly result?: unknown;
}

let historyCollection: HistItem[] = [];

export const clearHistoryCollection = (): void => {
  historyCollection = [];
};

export const getHistoryCollection = (): readonly HistItem[] => historyCollection;

export const addToHistoryCollection = (item: HistItem): void => {
  historyCollection.unshift(item);
};

