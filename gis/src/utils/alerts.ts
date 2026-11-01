interface AlertReadState {
  is_read: boolean;
}

interface StoredAlertOrderingFields {
  id: number;
  created_at: string;
}

export const countUnreadAlerts = (alerts: AlertReadState[]): number =>
  alerts.filter((alert) => !alert.is_read).length;

/** Newest stored alert first; ID breaks equal timestamps. */
export const sortAlertsNewestFirst = <T extends StoredAlertOrderingFields>(
  alerts: T[]
): T[] =>
  [...alerts].sort((left, right) => {
    const leftTime = Date.parse(left.created_at);
    const rightTime = Date.parse(right.created_at);

    if (
      Number.isFinite(leftTime) &&
      Number.isFinite(rightTime) &&
      leftTime !== rightTime
    ) {
      return rightTime - leftTime;
    }

    return right.id - left.id;
  });
